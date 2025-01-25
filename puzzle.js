async function load_config() {
    return await fetch('crypto_config.json').then((response) => response.json());
}

async function generate_key(pswd, salt) {
    
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
            salt: encoder.encode(salt),
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}

async function encrypt_text(plaintext, pswd, salt) {
    
    const key = await generate_key(pswd, salt);
    const iv = new Uint8Array(12);
    crypto.getRandomValues(iv);

    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    
    const encryptedData = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        data
    );

    return {
        encrypted_text: btoa(String.fromCharCode.apply(null, new Uint8Array(encryptedData))),
        iv: btoa(String.fromCharCode.apply(null, iv))
    }
}

async function decrypt_text(cyphertext, pswd, salt, iv) {

    const key = await generate_key(pswd, salt);

    const encryptedData = Uint8Array.from(atob(cyphertext), c => c.charCodeAt(0)).buffer;
    const ivData = Uint8Array.from(atob(iv), c => c.charCodeAt(0));

    const decryptedData = await window.crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: ivData
        },
        key,
        encryptedData
    );

    const decoder = new TextDecoder();
    const plaintext = decoder.decode(decryptedData);

    return plaintext;
}

async function encrypt() {
    const crypto_config = await load_config();
    const plaintext = document.getElementById('user_msg').value;
    const pswd = document.getElementById('pswd').value;

    encryption_results = await encrypt_text(plaintext, pswd, crypto_config.PBKDF2_SALT);

    document.getElementById('output').innerText = encryption_results.encrypted_text;
    document.getElementById('iv').innerText = encryption_results.iv;
}

async function decrypt() {
    const crypto_config = await load_config();
    const pswd = document.getElementById('pswd').value.toLowerCase();
    const cyphertext = await fetch('encrypted_text.txt').then((response) => response.text());

    try {
        document.getElementById('output').innerText = await decrypt_text(cyphertext, pswd, crypto_config.PBKDF2_SALT, crypto_config.iv);
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