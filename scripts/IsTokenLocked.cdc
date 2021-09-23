import Nanobash from 0xProfile

pub fun main(tokenID: UInt64): Bool {
    return Nanobash.isTokenLocked(tokenID: tokenID)
}