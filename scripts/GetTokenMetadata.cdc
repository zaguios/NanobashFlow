import Nanobash from 0xProfile

pub fun main(tokenID: UInt64): {String: String} {
    return Nanobash.getTokenMetadata(tokenID: tokenID)
}