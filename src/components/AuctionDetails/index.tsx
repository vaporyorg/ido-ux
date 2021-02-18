import React, { useMemo } from "react";
import styled from "styled-components";
import { ExternalLink } from "../../theme";
import {
  useDerivedAuctionInfo,
  AuctionState,
  useDerivedAuctionState,
  orderToPrice,
  orderToSellOrder,
} from "../../state/orderPlacement/hooks";

import { OrderBookBtn } from "../OrderbookBtn";
import { getEtherscanLink, getTokenDisplay } from "../../utils";
import { useActiveWeb3React } from "../../hooks";
import { useClearingPriceInfo } from "../../hooks/useCurrentClearingOrderAndVolumeCallback";

const Wrapper = styled.div`
  position: relative;
  width: calc(60% - 8px);
  background: none;
  box-shadow: none;
  border-radius: 20px;
  padding: 0px;
  flex: 0 1 auto;
  box-sizing: border-box;
  display: flex;
  flex-flow: column wrap;
  align-items: center;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    width: 100%;
  `};
`;

const Details = styled.div`
  color: ${({ theme }) => theme.text1};
  font-size: 13px;
  font-weight: normal;
  align-items: center;
  margin-right: auto;
  margin-left: auto;
  width: 100%;
  display: flex;
  flex-flow: column wrap;
  padding: 16px;
  margin: 16px 0 0;
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.bg2};
`;

const Row = styled.span`
  flex-flow: row-wrap;
  width: 100%;
  justify-content: space-between;
  align-items: flex;
  margin: 0 0 4px 0;
  font-weight: normal;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-areas: "label value";

  > i {
    color: ${({ theme }) => theme.text3};
    font-style: normal;
    text-align: left;
  }

  > a {
    text-align: right;
  }

  > p {
    margin: 0;
    padding: 0;
    text-align: right;
    white-space: normal;
  }
`;

export default function AuctionDetails() {
  const { chainId } = useActiveWeb3React();
  const {
    auctioningToken,
    biddingToken,
    clearingPrice,
    initialAuctionOrder,
    initialPrice,
  } = useDerivedAuctionInfo();
  const { auctionState } = useDerivedAuctionState();

  const auctionTokenAddress = useMemo(
    () => getEtherscanLink(chainId, auctioningToken?.address, "address"),
    [chainId, auctioningToken],
  );

  const biddingTokenAddress = useMemo(
    () => getEtherscanLink(chainId, biddingToken?.address, "address"),
    [chainId, biddingToken],
  );

  const clearingPriceInfo = useClearingPriceInfo();
  const clearingPriceInfoAsSellorder =
    clearingPriceInfo &&
    orderToSellOrder(
      clearingPriceInfo.clearingOrder,
      biddingToken,
      auctioningToken,
    );
  let clearingPriceNumber = orderToPrice(
    clearingPriceInfoAsSellorder,
  )?.toSignificant(4);

  if (clearingPrice) {
    clearingPriceNumber = clearingPrice && clearingPrice.toSignificant(4);
  }
  const biddingTokenDisplay = useMemo(() => getTokenDisplay(biddingToken), [
    biddingToken,
  ]);

  const auctioningTokenDisplay = useMemo(
    () => getTokenDisplay(auctioningToken),
    [auctioningToken],
  );

  const clearingPriceDisplay = !!clearingPriceNumber
    ? `${clearingPriceNumber} ${getTokenDisplay(
        biddingToken,
      )} per ${getTokenDisplay(auctioningToken)}`
    : "-";

  const titlePrice = useMemo(
    () =>
      auctionState == AuctionState.ORDER_PLACING ||
      auctionState == AuctionState.ORDER_PLACING_AND_CANCELING
        ? "Current price"
        : auctionState == AuctionState.PRICE_SUBMISSION
        ? "Clearing price"
        : "Closing price",
    [auctionState],
  );

  return (
    <Wrapper>
      <OrderBookBtn baseToken={auctioningToken} quoteToken={biddingToken} />
      <Details>
        <Row>
          <i title='"Current Price" shows the current closing price of the auction if no more bids are submitted or canceled'>
            {titlePrice}
          </i>
          <p>{clearingPriceDisplay}</p>
        </Row>
        <Row>
          <i>Bidding with</i>
          <ExternalLink href={biddingTokenAddress}>
            {biddingTokenDisplay} ↗
          </ExternalLink>
        </Row>

        <Row>
          <i>Total auctioned</i>
          <p>
            {initialAuctionOrder?.sellAmount.toSignificant(2)}{" "}
            <ExternalLink href={auctionTokenAddress}>
              {auctioningTokenDisplay} ↗
            </ExternalLink>
          </p>
        </Row>

        <Row>
          <i>Min. sell price</i>
          <p>
            {initialPrice ? `${initialPrice?.toSignificant(2)} ` : " - "}
            {biddingTokenDisplay} per {auctioningTokenDisplay}
          </p>
        </Row>
      </Details>
    </Wrapper>
  );
}