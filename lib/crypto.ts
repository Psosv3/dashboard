import crypto from 'crypto'

/**
 * Décrypte un message chiffré avec AES-256-GCM
 * @param tokenB64 Le message chiffré en base64 (nonce + ciphertext)
 * @returns Le texte déchiffré
 */
export function decrypt(tokenB64: string): string {
  try {
    // Récupérer la clé de chiffrement depuis les variables d'environnement
    const keyB64 = process.env.CHATBOT_KEK_V1_B64
    if (!keyB64) {
      throw new Error('CHATBOT_KEK_V1_B64 environment variable is not set')
    }

    // Décoder la clé depuis base64
    const key = Buffer.from(keyB64, 'base64')

    // Décoder le message chiffré depuis base64
    const raw = Buffer.from(tokenB64, 'base64')

    // Extraire le nonce (12 premiers octets) et le ciphertext (reste)
    const nonce = raw.subarray(0, 12)
    const ciphertext = raw.subarray(12)

    // Créer le déchiffreur AES-256-GCM
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce)

    // Extraire le tag d'authentification (16 derniers octets du ciphertext)
    const authTag = ciphertext.subarray(ciphertext.length - 16)
    const encryptedData = ciphertext.subarray(0, ciphertext.length - 16)

    decipher.setAuthTag(authTag)

    // Déchiffrer
    let decrypted = decipher.update(encryptedData, undefined, 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('Erreur lors du décryptage:', error)
    throw new Error('Échec du décryptage du message')
  }
}

/**
 * Tente de décrypter un message, retourne le message original en cas d'erreur
 * @param content Le contenu potentiellement chiffré
 * @returns Le contenu déchiffré ou original
 */
export function safeDecrypt(content: string): string {
  try {
    // Vérifier si le contenu ressemble à du base64
    if (!content || content.length < 16) {
      return content
    }
    return decrypt(content)
  } catch (error) {
    // Si le décryptage échoue, retourner le contenu original
    return content
  }
}

