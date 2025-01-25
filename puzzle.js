async function load_config() {
    return await fetch('crypto_config.json').then((response) => response.json());
}

async function generate_key(pswd) {
    
    crypto_config = await load_config();
    
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
        ['encrypt', 'decrypt']
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

async function decrypt_text(cyphertext, pswd) {

    const key = await generate_key(pswd);

    const encryptedData = Uint8Array.from(atob(cyphertext), c => c.charCodeAt(0)).buffer;

    const decryptedData = await window.crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: new Uint8Array(12) // Not important as this is a one-time puzzle
        },
        key,
        encryptedData
    );

    const decoder = new TextDecoder();
    const plaintext = decoder.decode(decryptedData);

    return plaintext;
}

async function encrypt() {
    const plaintext = document.getElementById('user_msg').value;
    const pswd = document.getElementById('pswd').value;

    document.getElementById('output').innerText = await encrypt_text(plaintext, pswd);
}

async function decrypt() {
    const pswd = document.getElementById('pswd').value;
    const cyphertext = await fetch('encrypted_text.txt').then((response) => response.text());

    try {
        document.getElementById('output').innerText = await decrypt_text(cyphertext, pswd);
    }
    catch (e) {
        if (e.name === 'OperationError') {
            document.getElementById('output').innerText = 'Incorrect password';
        }
        else {
            document.getElementById('output').innerText = 'An error occurred';
        }
    }

    
}