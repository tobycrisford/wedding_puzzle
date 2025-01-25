async function generate_key(pswd) {
    
    crypto_config = await fetch('crypto_config.json').then((response) => response.json());
    
    const encoder = new TextEncoder();
    const data = encoder.encode(pswd);

    const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        data,
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
    );
        
    return await window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: encoder.encode(crypto_config.PBDKDF2_SALT),
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt']
    );
}

async function encrypt_text(plaintext, pswd) {
    
    const key = await generate_key(pswd);

    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    
    const encryptedData = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: new Uint8Array(12) // Not important as this is a one-time puzzle
        },
        key,
        data
    );

    return btoa(String.fromCharCode.apply(null, new Uint8Array(encryptedData)));;
}

async function encrypt() {
    const plaintext = document.getElementById('user_msg').value;
    const pswd = document.getElementById('pswd').value;

    document.getElementById('output').innerText = await encrypt_text(plaintext, pswd);
}