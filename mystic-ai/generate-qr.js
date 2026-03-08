const QRCode = require('qrcode');
const fs = require('fs');

const address = 'ethereum:0x44B82c81d3f5c712ACFaf3C6e760779A41b2ACE6';

QRCode.toFile('donate-qr.png', address, {
    width: 300,
    margin: 2,
    color: {
        dark: '#000000',
        light: '#ffffff'
    }
}, (err) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('✅ QR code saved: donate-qr.png');
    }
});
