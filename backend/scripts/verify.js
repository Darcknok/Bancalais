const bcrypt = require('bcryptjs');

const hashFromFile = '$2a$10$9taRF8kdIIoTMBBdOJiVxenzUM6dW00Afo3oWMfMrS0kEm9.NIi7.';
console.log('Testing hash:', hashFromFile);
console.log('Match 123456:', bcrypt.compareSync('123456', hashFromFile));

// Generate new hash
const newHash = bcrypt.hashSync('123456', 10);
console.log('New hash:', newHash);
console.log('New hash matches:', bcrypt.compareSync('123456', newHash));
