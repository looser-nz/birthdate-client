const crypto = require('crypto');

const key = process.argv[2];
if (!key) {
  console.error('Usage: node decrypt.js <key>');
  process.exit(1);
}

const PAYLOAD = {
  salt: '4abfc7861d3c90508ae682383ca86b61',
  iv:   'd30ef25f08bd2759c1a4d913',
  tag:  '441f978541b76d1145d93da5aded97be',
  data: 'e420a1b716cb00852c2a87aa67',
};

try {
  const derivedKey = crypto.pbkdf2Sync(
    key,
    Buffer.from(PAYLOAD.salt, 'hex'),
    200000,
    32,
    'sha256'
  );

  const decipher = crypto.createDecipheriv(
    'aes-128-ctr',
    derivedKey,
    Buffer.from(PAYLOAD.iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(PAYLOAD.tag, 'hex'));

  let result  = decipher.update(PAYLOAD.data, 'hex', 'utf8');
      result += decipher.final('utf8');

  console.log(result);
} catch {
  console.error('Decryption failed: wrong key or corrupted data');
  process.exit(1);
}
