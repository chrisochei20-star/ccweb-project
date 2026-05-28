import { closePaymentModal, useFlutterwave } from "flutterwave-react-v3";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { verifyFlutterwavePayment } from "../api/paymentsApi";
import { formatPaymentError, isFlutterwavePaymentSuccessful } from "../lib/paymentErrors";

const IDLE_FW_CONFIG = {
  public_key: "FLWPUBK_TEST-00000000000000000000000000000000-X",
  tx_ref: "ccweb_idle",
  amount: 1,
  currency: "USD",
  payment_options: "card,mobilemoney,ussd",
  customer: { email: "idle@ccweb.local", phone_number: "08000000000", name: "Idle" },
  customizations: { title: "CCWEB", description: "Idle" },
};

/**
 * Shared Flutterwave Standard checkout: prepare → modal → server verify (no client-side unlock).
 *
 * @param {{
 *   publicKey: string;
 *   user?: { email?: string; displayName?: string; phone?: string } | null;
 *   title?: string;
 *   onVerified?: (result: object) => void | Promise<void>;
 *   onCancel?: () => void;
 * }} options
 */
export function useFlutterwaveCheckout({ publicKey, user, title = "CCWEB", onVerified, onCancel }) {
  const [payload, setPayload] = useState(null);
  const [phase, setPhase] = useState("idle");
  const [error, setError] = useState(null);
  const inFlightRef = useRef(false);
  const lastTxRefRef = useRef(null);
  const verifyingRef = useRef(false);

  const fwConfig = useMemo(() => {
    if (!payload || !publicKey) return IDLE_FW_CONFIG;
    return {
      public_key: publicKey,
      tx_ref: payload.txRef,
      amount: payload.amountUsd,
      currency: "USD",
      payment_options: "card,mobilemoney,ussd",
      customer: {
        email: user?.email || "customer@ccweb.local",
        phone_number: (user?.phone || "").toString().trim() || "08000000000",
        name: user?.displayName || "Customer",
      },
      customizations: {
        title,
        description: payload.narration || title,
      },
    };
  }, [payload, publicKey, user?.email, user?.displayName, user?.phone, title]);

  const openFlutterwave = useFlutterwave(fwConfig);

  const runVerify = useCallback(
    async (txRef) => {
      verifyingRef.current = true;
      setPhase("verifying");
      setError(null);
      try {
        const result = await verifyFlutterwavePayment(txRef);
        setPhase("success");
        setPayload(null);
        inFlightRef.current = false;
        await onVerified?.(result);
        return result;
      } catch (e) {
        const msg = formatPaymentError(e);
        setError(msg);
        setPhase("error");
        inFlightRef.current = false;
        throw e;
      } finally {
        verifyingRef.current = false;
      }
    },
    [onVerified]
  );

  useEffect(() => {
    if (!payload) return undefined;
    let cancelled = false;
    const current = payload;
    lastTxRefRef.current = current.txRef;

    openFlutterwave({
      callback: async (response) => {
        if (cancelled) return;
        closePaymentModal();
        if (!isFlutterwavePaymentSuccessful(response)) {
          setError("Payment was not completed. You can try again.");
          setPhase("error");
          setPayload(null);
          inFlightRef.current = false;
          return;
        }
        try {
          await runVerify(current.txRef);
        } catch {
          /* error state set in runVerify */
        }
      },
      onClose: () => {
        if (cancelled) return;
        if (verifyingRef.current) return;
        setPayload(null);
        setPhase("idle");
        inFlightRef.current = false;
        onCancel?.();
      },
    });

    return () => {
      cancelled = true;
    };
  }, [payload, openFlutterwave, runVerify, onCancel]);

  const startCheckout = useCallback(
    async (prepareFn) => {
      if (inFlightRef.current) return null;
      if (!publicKey) {
        const err = new Error("Payments are not configured (missing VITE_FLUTTERWAVE_PUBLIC_KEY).");
        setError(formatPaymentError(err));
        setPhase("error");
        throw err;
      }
      inFlightRef.current = true;
      setPhase("preparing");
      setError(null);
      try {
        const prep = await prepareFn();
        if (!prep?.txRef || prep.amountUsd == null) {
          throw new Error(prep?.error || "Checkout could not be started.");
        }
        setPayload({
          txRef: prep.txRef,
          amountUsd: Number(prep.amountUsd),
          narration: prep.narration || title,
        });
        setPhase("modal");
        return prep;
      } catch (e) {
        inFlightRef.current = false;
        setPhase("error");
        setError(formatPaymentError(e));
        throw e;
      }
    },
    [publicKey, title]
  );

  const retryVerify = useCallback(async () => {
    const txRef = lastTxRefRef.current;
    if (!txRef) {
      setError("No payment reference to retry.");
      return null;
    }
    inFlightRef.current = true;
    return runVerify(txRef);
  }, [runVerify]);

  const clearPaymentState = useCallback(() => {
    setError(null);
    setPhase("idle");
    setPayload(null);
    inFlightRef.current = false;
  }, []);

  const isBusy = phase === "preparing" || phase === "modal" || phase === "verifying";

  return {
    phase,
    error,
    isBusy,
    startCheckout,
    retryVerify,
    clearPaymentState,
  };
}

export { IDLE_FW_CONFIG };
