const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('123456', 10);
console.log('Hash:', hash);
console.log('Length:', hash.length);
console.log('Verify:', bcrypt.compareSync('123456', hash));
