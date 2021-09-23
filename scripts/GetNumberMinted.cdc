import Nanobash from 0xProfile

pub fun main(tokenID: UInt64): UInt64 {
    return Nanobash.getNumberMinted(tokenID: tokenID)
}