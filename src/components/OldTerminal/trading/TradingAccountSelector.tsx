import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../Dialog";
import { Checkbox } from "../Checkbox";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import type { FormEvent } from "react";

export type Account = {
  label: string;
  apiKey: string;
  apiSecret: string;
  mockTrading?: boolean;
};

import { persistentAtom } from "@nanostores/persistent";

export const selectedAccount = persistentAtom<Account>(
  "selectedAccount",
  null,
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  }
);

export const accounts = persistentAtom<Account[]>("binanceAccounts", [], {
  encode: JSON.stringify,
  decode: JSON.parse,
});

export const deleteAccount = (account) => {
  accounts.set(
    accounts
      .get()
      .filter(
        (a) =>
          a.label !== account.label &&
          a.apiKey !== account.apiKey &&
          a.apiSecret !== account.apiSecret
      )
  );
  selectedAccount.set(null);
  toast.success("Account deleted successfully");
  setTimeout(() => window.location.reload(), 500);
};

export default function TradingAccountSelector({ user }) {
  const [deletingAccount, setDeletingAccount] = useState(null);
  const [view, setView] = useState("accounts");

  const addAccount = (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    accounts.set([
      ...accounts.get(),
      {
        label: e.target.label.value,
        apiKey: e.target.apiKey.value,
        apiSecret: e.target.apiSecret.value,
        mockTrading: e.target.mockTrading.checked,
      },
    ]);
    toast.success("Account added successfully");
    setView("accounts");
  };

  useEffect(() => {
    const account = {
      label: user.email,
      apiKey: user.usingTestnet
        ? user.binanceTestnetSubAccountApiKey
        : user.binanceSubAccountApiKey,
      apiSecret: user.usingTestnet
        ? user.binanceTestnetSubAccountApiSecret
        : user.binanceSubAccountApiSecret,
      mockTrading: user.usingTestnet,
    };

    if (selectedAccount.get()?.apiKey !== account.apiKey) {
      selectedAccount.set(account);
    }
  }, []);

  return (
    <Dialog
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          setView("accounts");
        }
      }}
    >
      <DialogTrigger className="text-gray-400 hover:text-gray-600">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
          />
        </svg>
      </DialogTrigger>
      <DialogContent className="relative z-50 bg-lightGray dark:bg-darkDarkBlue p-6 max-w-[350px] w-full">
        <DialogTitle className="flex flex-row items-center text-xl font-semibold gap-x-6 justify-between">
          <div className="flex flex-row items-center gap-x-4">
            <h3>Trading accounts</h3>
            <button
              onClick={() => setView("addAccount")}
              className={view !== "accounts" ? "hidden" : undefined}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
                />
              </svg>
            </button>
          </div>
        </DialogTitle>
        {view === "accounts" && (
          <>
            <div className="flex flex-col gap-4 mt-8">
              <button
                onClick={() => {
                  selectedAccount.set(null);
                  setTimeout(() => window.location.reload(), 500);
                }}
                style={{ outlineWidth: "1px" }}
                className={`p-4 bg-white dark:bg-darkBlue border outline rounded-md ${
                  selectedAccount.get() === null
                    ? "border-accent outline-accent"
                    : "outline-gray-400 border-transparent"
                } flex flex-row gap-x-4 items-center`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-10 h-10"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <div className="text-left">
                  <div className="font-semibold">{user?.email}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    udubu account
                  </div>
                </div>
              </button>
              {accounts.get().map((account, index) => (
                <div
                  style={{ outlineWidth: "1px" }}
                  key={index}
                  className={`p-4 bg-white dark:bg-darkBlue border outline relative rounded-md ${
                    selectedAccount.get()?.label === account.label
                      ? "border-accent outline-accent"
                      : "outline-gray-400 border-transparent"
                  } flex flex-row items-center`}
                >
                  <button
                    onClick={(e) => {
                      setTimeout(() => window.location.reload(), 500);
                    }}
                    className="flex-1 flex flex-row gap-x-4 items-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-10 h-10"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <div className="text-left">
                      <div className="font-semibold">{account.label}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        API account
                      </div>
                    </div>
                  </button>
                  <div
                    className="text-gray-400 hover:text-red-400 ml-auto cursor-pointer z-10"
                    title="Delete"
                    onClick={(e) => {
                      e.preventDefault();
                      setDeletingAccount(account);
                      setView("deleteAccount");
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-6 h-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              ))}
            </div>

            <hr className="mt-4" />
            <p className="text-sm mt-4">
              <b>udubu account:</b> You are trading with udubu funded account.
            </p>
            <p className="text-sm mt-4">
              <b>API account:</b> You can connect your API keys to trade with
              your own accounts. This is for your convinience.
            </p>
          </>
        )}

        {view === "addAccount" && (
          <form autoComplete="off" onSubmit={(e) => addAccount(e)}>
            <div className="flex flex-col gap-y-4 mt-4">
              <input type="text" name="label" required placeholder="Label" />
              <input type="text" name="apiKey" required placeholder="Api key" />
              <input
                type="text"
                name="apiSecret"
                required
                placeholder="Api secret"
              />
            </div>
            <div className="flex flex-row mt-4 justify-between">
              <div className="flex flex-row items-center gap-x-2">
                <Checkbox name="mockTrading" />
                <label htmlFor="mockTrading">Mock trading</label>
              </div>
              <div>
                <button
                  className="text-black dark:text-gray-300 py-2 px-8"
                  onClick={() => setView("accounts")}
                >
                  Cancel
                </button>
                <button
                  className="bg-accent text-black py-2 px-8 rounded-md"
                  type="submit"
                >
                  Save
                </button>
              </div>
            </div>
          </form>
        )}

        {view === "deleteAccount" && (
          <div>
            <div className="flex flex-col gap-y-4 mt-4">
              Are you sure you want to delete account: {deletingAccount?.label}
            </div>
            <div className="flex flex-row mt-4 justify-end">
              <button
                className="text-black dark:text-gray-300 py-2 px-8"
                onClick={() => setView("accounts")}
              >
                Cancel
              </button>
              <button
                className="bg-accent text-black py-2 px-8 rounded-md"
                onClick={(e) => {
                  deleteAccount(deletingAccount);
                  setView("accounts");
                }}
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
