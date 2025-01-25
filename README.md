# Wedding puzzle game

Used for a taskmaster style challenge at my wedding.

First round involves solving a puzzle to get a password, which is used to decrypt a message detailing the next round of the puzzle. This gives an interactive puzzle that runs entirely client side, but without the solution being visible in the source code.

## How to use

If you'd like to use this framework for a different puzzle, the way to set it up is:

- Launch a local development web server from this repo (e.g. python -m http.server)
- Navigate to /encrypt_puzzle_answer.html in a browser, and enter your secret text in the big box, and the desired password in the small box. Press the button.
- The first line you get back is your encrypted data. The second line is the initialization vector that is needed (along with the private key) to decrypt it.
- Copy/paste the encrypted text into the 'encrypted_text.txt' file, and the initialization vector into the crypto_config.json file.
- Now your puzzle app is ready to be deployed!

## Potential Security Vulnerability

I've now realised there was a serious vulnerability in my initial crypto implementation, which is worth bearing in mind if borrowing any of this code!

With the encryption algorithm I'm using, I am supposed to generate a random "initialization vector" each time I encrypt a message. This initialization vector then needs to be shared with the person reading the message in order for them to be able to decrypt it (they need both this initialization vector *and* the private key).

Since my puzzle is a one-time thing (I am encrypting a single secret message for the user to read) I initially didn't think I needed to bother implementing this, and I just used a default array as the initialization vector every time.

However, I was forgetting that in order to host the puzzle on github pages, I would need to include the encrypted message in a public github repo, *and that it would then be version tracked*. This means that every time I've made a change to the secret message, the corresponding change to the encrypted message has been recorded and made visible for everyone to see, and to begin with I was using the same private key and initialization vector every time!

This means, for example, that it is simple for anyone to see which part of the secret message has been changed with every update I have made (already technically a security weakness). But even more seriously, if an attacker knows what kind of data my secret message is likely to contain (e.g. plaintext characters spelling out standard English text) then I think they can probably use the changes in the encrypted data to infer a lot of information about the private key (in the same way that you leak information if you re-use a one-time pad).

This vulnerability is now patched (the encryption page will randomly generate a new initialization vector each time and give this back to you to update the config with), although the important contents of my secret message have probably already been compromised with the existing repo version history!

Of course, if anyone did manage to complete the puzzle by exploiting this vulnerability (rather than just solving the cryptic clue) then I would be very impressed and they would very much deserve their success!