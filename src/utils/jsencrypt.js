import JSEncrypt from 'jsencrypt'

// 公钥 - 用于前端加密
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDjnZ2z7eZVeEg/8qX1xDbsxd9A
CgcJUs73C1GInCSHoOWmcdaaVsfBlnxaccJmO39NtUSmhps6DFUCYjaoZfgw6BXZ
3NLIQPFp3u2qurlc4I+C8BXt04qqOoVXxSyXHtBJom98qWwiiXddy8H9KgevblLW
r6vnlbBlpPfNoVChEQIDAQAB
-----END PUBLIC KEY-----`

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
