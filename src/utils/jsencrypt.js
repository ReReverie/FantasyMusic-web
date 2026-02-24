import JSEncrypt from 'jsencrypt'

// 公钥 - 用于前端加密
const PUBLIC_KEY = import.meta.env.VITE_RSA_PUBLIC_KEY

/**
 * RSA加密
 * @param {string} txt 需要加密的字符串
 * @returns {string} 加密后的字符串 (Base64 encoded)
 */
export function encrypt(txt) {
  const encryptor = new JSEncrypt()
  encryptor.setPublicKey(PUBLIC_KEY)
  // encrypt() returns false on failure, or the encrypted string
  return encryptor.encrypt(txt)
}
