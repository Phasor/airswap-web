import { useCallback, useEffect, useRef, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { TokenInfo } from "@airswap/types";

import { formatUnits } from "ethers/lib/utils";
import { AnimatePresence, useReducedMotion } from "framer-motion";

import { BalancesState } from "../../features/balances/balancesSlice";
import { SubmittedTransaction } from "../../features/transactions/transactionsSlice";
import useWindowSize from "../../helpers/useWindowSize";
import useAddressOrEnsName from "../../hooks/useAddressOrEnsName";
import Icon from "../Icon/Icon";
import { InfoHeading } from "../Typography/Typography";
import {
  Container,
  WalletHeader,
  Legend,
  LegendLine,
  TransactionContainer,
  TransactionsContainer,
  DiconnectButtonContainer,
  DisconnectButton,
  NoTransactions,
  IconContainer,
  BackButton,
  NetworkInfoContainer,
  NetworkName,
  Balances,
  WalletInfoButton,
  ConnectionStatusCircle,
  LegendContainer,
} from "./TransactionsTab.styles";
import AnimatedWalletTransaction from "./subcomponents/AnimatedWalletTransaction/AnimatedWalletTransaction";

const addressMapping: Record<number, string> = {
  1: "Mainnet",
  4: "Rinkeby",
};

type TransactionsTabType = {
  address: string;
  chainId: number;
  open: boolean;
  setTransactionsTabOpen: (x: boolean) => void;
  /**
   * Callback function for when disconnect button is clicked
   */
  onDisconnectWalletClicked: () => void;
  transactions: SubmittedTransaction[];
  tokens: TokenInfo[];
  balances: BalancesState;
  isUnsupportedNetwork?: boolean;
};

const TransactionsTab = ({
  address = "",
  chainId,
  open,
  setTransactionsTabOpen,
  onDisconnectWalletClicked,
  transactions = [],
  tokens = [],
  balances,
  isUnsupportedNetwork = false,
}: TransactionsTabType) => {
  const { width, height } = useWindowSize();
  const shouldReduceMotion = useReducedMotion();
  const { t } = useTranslation();

  const [overflow, setOverflow] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const transactionsScrollRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  const addressOrName = useAddressOrEnsName(address);

  const handleEscKey = useCallback(
    (e) => {
      if (e.keyCode === 27) {
        setTransactionsTabOpen(false);
      }
    },
    [setTransactionsTabOpen]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleEscKey, false);
    return () => {
      document.removeEventListener("keydown", handleEscKey, false);
    };
  }, [handleEscKey]);

  useEffect(() => {
    if (
      containerRef.current &&
      transactionsScrollRef.current &&
      buttonRef.current
    ) {
      const { offsetTop, scrollHeight } = transactionsScrollRef.current;
      const containerHeight = containerRef.current.getBoundingClientRect()
        .height;
      const buttonHeight = buttonRef.current.getBoundingClientRect().height;
      setOverflow(scrollHeight + offsetTop > containerHeight - buttonHeight);
    }
  }, [
    containerRef,
    transactionsScrollRef,
    buttonRef,
    width,
    height,
    open,
    transactions,
  ]);

  // Every time a new transactions is added, scroll to top.
  useEffect(() => {
    if (transactionsScrollRef && transactionsScrollRef.current) {
      transactionsScrollRef.current.scrollTo({ top: 0 });
    }
  }, [transactionsScrollRef, transactions]);

  const pendingTransactions = useMemo(() => {
    return transactions.filter(
      (transaction) => transaction.status === "processing"
    );
  }, [transactions]);

  const completedTransactions = useMemo(() => {
    return transactions.filter(
      (transaction) => transaction.status !== "processing"
    );
  }, [transactions]);

  const balance =
    balances.values["0x0000000000000000000000000000000000000000"] || "0";

  return (
    <AnimatePresence>
      {open && (
        <Container
          ref={containerRef}
          animate={{ x: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
          initial={{ x: "24rem" }}
          exit={{ x: "24rem" }}
        >
          <BackButton
            aria-label={t("common.back")}
            animate={{ y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.5 }}
            initial={{ y: "-5rem" }}
            exit={{ opacity: 0 }}
            onClick={() => setTransactionsTabOpen(false)}
          >
            <Icon name="chevron-right" iconSize={1.5} />
          </BackButton>
          <WalletHeader>
            <NetworkInfoContainer>
              <NetworkName>
                {addressMapping[chainId] || t("wallet.unsupported")}
              </NetworkName>
              <Balances>{formatUnits(balance).substring(0, 5)} ETH</Balances>
            </NetworkInfoContainer>
            <WalletInfoButton
              onClick={setTransactionsTabOpen.bind(null, false)}
            >
              <ConnectionStatusCircle $connected={!!address} />
              <InfoHeading>
                {isUnsupportedNetwork
                  ? t("wallet.unsupported")
                  : addressOrName
                  ? addressOrName
                  : t("wallet.notConnected")}
              </InfoHeading>
            </WalletInfoButton>
          </WalletHeader>

          <TransactionsContainer
            ref={transactionsScrollRef}
            $overflow={overflow}
          >
            <LegendContainer $isVisible={!!pendingTransactions.length}>
              <Legend>
                <LegendLine>
                  {t("wallet.activeTransactions").toUpperCase()}
                </LegendLine>
              </Legend>
            </LegendContainer>
            <TransactionContainer $isEmpty={!pendingTransactions.length}>
              <AnimatePresence initial={false}>
                {pendingTransactions.map((transaction) => (
                  <AnimatedWalletTransaction
                    key={`${transaction.hash}-${transaction.nonce}-${transaction.expiry}-pending`}
                    transaction={transaction}
                    tokens={tokens}
                    chainId={chainId!}
                  />
                ))}
              </AnimatePresence>
            </TransactionContainer>
            <LegendContainer $isVisible>
              <Legend>
                <LegendLine>
                  {t("wallet.completedTransactions").toUpperCase()}
                </LegendLine>
              </Legend>
            </LegendContainer>
            <TransactionContainer>
              <AnimatePresence initial={false}>
                {completedTransactions.slice(0, 10).map((transaction) => (
                  <AnimatedWalletTransaction
                    key={`${transaction.hash}-${transaction.nonce}-${transaction.expiry}`}
                    transaction={transaction}
                    tokens={tokens}
                    chainId={chainId!}
                  />
                ))}
              </AnimatePresence>
              {!completedTransactions.length && (
                <NoTransactions>
                  <IconContainer>
                    <Icon name="transaction" />
                  </IconContainer>
                  {t("wallet.noCompletedTransactions")}
                </NoTransactions>
              )}
            </TransactionContainer>
          </TransactionsContainer>
          <DiconnectButtonContainer ref={buttonRef}>
            <DisconnectButton
              aria-label={t("wallet.disconnectWallet")}
              onClick={onDisconnectWalletClicked}
            >
              {t("wallet.disconnectWallet")}
            </DisconnectButton>
          </DiconnectButtonContainer>
        </Container>
      )}
    </AnimatePresence>
  );
};

export default TransactionsTab;
