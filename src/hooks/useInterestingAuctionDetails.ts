import { useEffect, useState } from 'react'

import { additionalServiceApi } from '../api'
import { getLogger } from '../utils/logger'
import { AuctionInfo } from './useAllAuctionInfos'

const logger = getLogger('useInterestingAuctionInfo')

export function useInterestingAuctionInfo(): Maybe<AuctionInfo[]> {
  const [auctionInfo, setMostInterestingAuctions] = useState<Maybe<AuctionInfo[]>>(null)

  useEffect(() => {
    let cancelled = false

    const fetchApiData = async (): Promise<void> => {
      try {
        if (!additionalServiceApi) {
          throw new Error('missing dependencies in useInterestingAuctionInfo callback')
        }
        const auctionInfo = await additionalServiceApi.getMostInterestingAuctionDetails()
        if (cancelled) return
        setMostInterestingAuctions(auctionInfo)
      } catch (error) {
        if (cancelled) return
        setMostInterestingAuctions(null)
        logger.error('Error getting clearing price info', error)
      }
    }
    fetchApiData()

    return (): void => {
      cancelled = true
    }
  }, [setMostInterestingAuctions])

  return auctionInfo
}
