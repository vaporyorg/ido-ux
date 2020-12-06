import { BigNumber } from "@ethersproject/bignumber";
import { Contract } from "@ethersproject/contracts";
import { ChainId, Token } from "@uniswap/sdk";
import { useMemo } from "react";
import { convertPriceIntoBuyAndSellAmount } from "../utils/prices";
import { useTransactionAdder } from "../state/transactions/hooks";
import { useSwapState } from "../state/orderplacement/hooks";
import { useActiveWeb3React } from "./index";
import { calculateGasMargin, getEasyAuctionContract } from "../utils";

export const queueStartElement =
  "0x0000000000000000000000000000000000000000000000000000000000000001";
export const queueLastElement =
  "0xffffffffffffffffffffffffffffffffffffffff000000000000000000000001";

// returns a function that will place an order, if the parameters are all valid
// and the user has approved the transfer of tokens
export function usePlaceOrderCallback(
  sellToken: Token,
  buyToken: Token,
): null | (() => Promise<string>) {
  const { account, chainId, library } = useActiveWeb3React();
  const addTransaction = useTransactionAdder();

  const { auctionId, sellAmount, price } = useSwapState();

  return useMemo(() => {
    return async function onPlaceOrder() {
      if (!chainId || !library || !account) {
        throw new Error("missing dependencies in onPlaceOrder callback");
      }

      const {
        sellAmountScaled,
        buyAmountScaled,
      } = convertPriceIntoBuyAndSellAmount(
        sellToken,
        buyToken,
        price,
        sellAmount,
      );
      if (sellAmountScaled == undefined || buyAmountScaled == undefined) {
        return "price was not correct";
      }
      const easyAuctionContract: Contract = getEasyAuctionContract(
        chainId as ChainId,
        library,
        account,
      );
      let estimate,
        method: Function,
        args: Array<string | string[] | number>,
        value: BigNumber | null;
      {
        estimate = easyAuctionContract.estimateGas.placeSellOrders;
        method = easyAuctionContract.placeSellOrders;
        args = [
          auctionId,
          [buyAmountScaled.toString()],
          [sellAmountScaled.toString()],
          [queueStartElement],
        ];
        value = null;
      }

      return estimate(...args, value ? { value } : {})
        .then((estimatedGasLimit) =>
          method(...args, {
            ...(value ? { value } : {}),
            gasLimit: calculateGasMargin(estimatedGasLimit),
          }),
        )
        .then((response) => {
          addTransaction(response, {
            summary:
              "Sell " +
              sellAmount +
              " " +
              buyToken.symbol +
              " for " +
              (parseFloat(sellAmount) / parseFloat(price)).toString() +
              " " +
              sellToken.symbol,
          });

          return response.hash;
        })
        .catch((error) => {
          console.error(`Swap or gas estimate failed`, error);
          throw error;
        });
    };
  }, [
    account,
    addTransaction,
    chainId,
    library,
    auctionId,
    buyToken,
    price,
    sellToken,
    sellAmount,
  ]);
}