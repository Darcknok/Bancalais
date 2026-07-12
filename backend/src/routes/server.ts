/**
 * Server monitoring route.
 * Collecte et sert les infos système de la machine hôte :
 * uptime, CPU, RAM, batterie, OS, etc.
 *
 * Mise en cache : rafraîchi toutes les 30 minutes en arrière-plan.
 */

import { Router, type Request, type Response } from 'express';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ─── Types ──────────────────────────────────────────────────────

export type ServerStatus = {
  /** Timestamp de la collecte */
  timestamp: string;
  /** Nom de la machine */
  hostname: string;
  /** OS */
  platform: string;
  /** Architecture CPU */
  arch: string;
  /** Version du kernel / OS */
  release: string;
  /** Uptime du système (secondes) */
  systemUptime: number;
  /** Uptime du process Node (secondes) */
  processUptime: number;
  /** Charge CPU moyenne (1, 5, 15 min) */
  loadAverage: number[];
  /** Nombre de CPU */
  cpuCount: number;
  /** Mémoire totale (octets) */
  totalMem: number;
  /** Mémoire libre (octets) */
  freeMem: number;
  /** Mémoire utilisée (pourcentage) */
  memUsagePercent: number;
  /** État de l'alimentation */
  power: PowerStatus;
};

export type PowerStatus = {
  /** Type d'alimentation */
  source: 'ac' | 'battery' | 'unknown';
  /** Pourcentage batterie (si sur batterie) */
  batteryPercent?: number;
  /** Temps restant estimé (minutes, si sur batterie) */
  batteryRemainingMin?: number;
  /** Message lisible */
  label: string;
};

// ─── Cache ──────────────────────────────────────────────────────

let cachedStatus: ServerStatus | null = null;
let lastFetch = 0;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

// ─── Collecteurs ────────────────────────────────────────────────

/**
 * Récupère l'état de l'alimentation.
 * Cross-platform : Windows → PowerShell, Linux → /sys/class/power_supply, macOS → pmset
 */
async function getPowerStatus(): Promise<PowerStatus> {
  const platform = process.platform;

  try {
    if (platform === 'win32') {
      // Windows : via WMIC ou PowerShell
      try {
        const { stdout } = await execAsync(
          'powershell -Command "Get-WmiObject -Class Win32_Battery | Select-Object BatteryStatus, EstimatedChargeRemaining, EstimatedRunTime | ConvertTo-Json"',
          { timeout: 5000 },
        );
        const data = JSON.parse(stdout.trim());
        if (data && data.BatteryStatus !== undefined) {
          const onBattery = data.BatteryStatus === 2; // 1=AC, 2=Battery
          if (onBattery) {
            return {
              source: 'battery',
              batteryPercent: data.EstimatedChargeRemaining ?? undefined,
              batteryRemainingMin: data.EstimatedRunTime && data.EstimatedRunTime > 0
                ? data.EstimatedRunTime
                : undefined,
              label: (data.EstimatedChargeRemaining != null ? `${data.EstimatedChargeRemaining}%` : '??')
                + (data.EstimatedRunTime && data.EstimatedRunTime > 0
                  ? ` — ${data.EstimatedRunTime} min restantes`
                  : ''),
            };
          }
          return { source: 'ac', label: 'Secteur' };
        }
      } catch {
        // Fallback : powercfg
        try {
          const { stdout } = await execAsync('powercfg /getactivescheme', { timeout: 3000 });
          return { source: 'ac', label: 'Secteur' };
        } catch {
          return { source: 'unknown', label: 'Inconnu' };
        }
      }
    }

    if (platform === 'linux') {
      // Linux : lecture /sys/class/power_supply
      try {
        const { stdout } = await execAsync(
          'for d in /sys/class/power_supply/*; do [ -d "$d" ] && echo "$(cat $d/type 2>/dev/null)|$(cat $d/status 2>/dev/null)|$(cat $d/capacity 2>/dev/null)|$(cat $d/energy_now 2>/dev/null)|$(cat $d/power_now 2>/dev/null)" ; done',
          { timeout: 5000 },
        );
        const lines = stdout.trim().split('\n').filter(Boolean);
        for (const line of lines) {
          const [type, status, capacity, energyNow, powerNow] = line.split('|');
          if (type === 'Battery') {
            if (status === 'Discharging') {
              const percent = capacity ? parseInt(capacity, 10) : undefined;
              let remainingMin: number | undefined;
              if (energyNow && powerNow && parseInt(powerNow) > 0) {
                const hours = parseInt(energyNow, 10) / parseInt(powerNow, 10);
                remainingMin = Math.round(hours * 60);
              }
              return {
                source: 'battery',
                batteryPercent: percent,
                batteryRemainingMin: remainingMin,
                label: (percent != null ? `${percent}%` : '??')
                  + (remainingMin ? ` — ${remainingMin} min restantes` : ''),
              };
            }
            return { source: 'ac', label: 'Secteur' };
          }
        }
      } catch {
        // Pas de batterie ? C'est un serveur
      }

      // Vérifier si UPS via upower
      try {
        const { stdout } = await execAsync('upower -d 2>/dev/null | grep -E "state|percentage|time to empty" | head -5', { timeout: 5000 });
        if (stdout.includes('discharging')) {
          const pctMatch = stdout.match(/percentage:\s+(\d+)%/);
          const timeMatch = stdout.match(/time to empty:\s+([\d.]+)\s+hours/);
          return {
            source: 'battery',
            batteryPercent: pctMatch ? parseInt(pctMatch[1], 10) : undefined,
            batteryRemainingMin: timeMatch ? Math.round(parseFloat(timeMatch[1]) * 60) : undefined,
            label: (pctMatch ? `${pctMatch[1]}%` : '??') + (timeMatch ? ` — ${Math.round(parseFloat(timeMatch[1]) * 60)} min restantes` : ''),
          };
        }
        if (stdout.includes('charging') || stdout.includes('fully-charged')) {
          return { source: 'ac', label: 'Secteur' };
        }
      } catch {
        // upower pas installé
      }

      return { source: 'unknown', label: 'Serveur (secteur probable)' };
    }

    if (platform === 'darwin') {
      try {
        const { stdout } = await execAsync('pmset -g batt', { timeout: 5000 });
        const match = stdout.match(/(\d+)%/);
        const discharging = stdout.includes('discharging');
        if (discharging) {
          const timeMatch = stdout.match(/(\d+:\d+)\s+remaining/);
          let remainingMin: number | undefined;
          if (timeMatch) {
            const [h, m] = timeMatch[1].split(':').map(Number);
            remainingMin = h * 60 + m;
          }
          return {
            source: 'battery',
            batteryPercent: match ? parseInt(match[1], 10) : undefined,
            batteryRemainingMin: remainingMin,
            label: (match ? `${match[1]}%` : '??') + (remainingMin ? ` — ${remainingMin} min restantes` : ''),
          };
        }
        return { source: 'ac', label: 'Secteur' };
      } catch {
        return { source: 'unknown', label: 'Inconnu' };
      }
    }

    return { source: 'unknown', label: 'Non supporté' };
  } catch {
    return { source: 'unknown', label: 'Erreur détection' };
  }
}

/**
 * Collecte toutes les infos système.
 */
async function collectStatus(): Promise<ServerStatus> {
  const memTotal = os.totalmem();
  const memFree = os.freemem();
  const memUsage = memTotal > 0 ? ((memTotal - memFree) / memTotal) * 100 : 0;

  const status: ServerStatus = {
    timestamp: new Date().toISOString(),
    hostname: os.hostname(),
    platform: `${os.type()} ${os.release()}`,
    arch: os.arch(),
    release: os.release(),
    systemUptime: os.uptime(),
    processUptime: Math.floor(process.uptime()),
    loadAverage: os.loadavg(),
    cpuCount: os.cpus().length,
    totalMem: memTotal,
    freeMem: memFree,
    memUsagePercent: Math.round(memUsage * 10) / 10,
    power: await getPowerStatus(),
  };

  return status;
}

/**
 * Retourne le statut serveur (depuis le cache ou collecte fraîche).
 */
async function getServerStatus(): Promise<ServerStatus> {
  const now = Date.now();
  if (cachedStatus && (now - lastFetch) < CACHE_TTL_MS) {
    return cachedStatus;
  }

  cachedStatus = await collectStatus();
  lastFetch = now;
  console.log('[server] Status collecté:', cachedStatus.hostname, cachedStatus.power.label);
  return cachedStatus;
}

// ─── Route ──────────────────────────────────────────────────────

export const serverRouter = Router();

/**
 * GET /api/server/status
 * Retourne les infos système de la machine hôte.
 * Mise en cache : rafraîchi toutes les 30 minutes.
 */
serverRouter.get('/status', async (_req: Request, res: Response) => {
  try {
    const status = await getServerStatus();
    res.json(status);
  } catch (err) {
    console.error('[server] Error getting status:', err);
    res.status(500).json({ error: 'Erreur récupération statut serveur' });
  }
});

// ─── Collecte initiale au démarrage ─────────────────────────────

// Lancer une première collecte après 5s (le temps que le serveur démarre)
setTimeout(() => {
  collectStatus().then(s => {
    cachedStatus = s;
    lastFetch = Date.now();
    console.log('[server] Première collecte effectuée');
  }).catch(err => {
    console.warn('[server] Première collecte échouée:', err);
  });
}, 5000);

// Recollecte toutes les 30 minutes
setInterval(async () => {
  try {
    cachedStatus = await collectStatus();
    lastFetch = Date.now();
    console.log('[server] Collecte périodique effectuée');
  } catch (err) {
    console.warn('[server] Collecte périodique échouée:', err);
  }
}, CACHE_TTL_MS);
