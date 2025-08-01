/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  Contract,
  ContractFactory,
  ContractTransactionResponse,
  Interface,
} from "ethers";
import type { Signer, ContractDeployTransaction, ContractRunner } from "ethers";
import type { NonPayableOverrides } from "../../../common";
import type {
  MockPancakeRouter,
  MockPancakeRouterInterface,
} from "../../../contracts/mocks/MockPancakeRouter";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "addLiquidityETH",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount0",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amount1",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "liquidity",
        type: "uint256",
      },
    ],
    name: "setAddLiquidityResult",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const _bytecode =
  "0x608080604052346100155760d7908161001b8239f35b600080fdfe6080806040526004361015601257600080fd5b600090813560e01c8063cfd9272914607a5763f305d71914603257600080fd5b60c03660031901126072576001600160a01b0360043581811603607657608435908116036072576060915460015460025491835260208301526040820152f35b5080fd5b8280fd5b8234609e576060366003190112609e57600435815560243560015560443560025580f35b80fdfea264697066735822122069640b5838cec4585fd7d9c7d50c27210e982d52bc3aaa9238d912fe458e387764736f6c63430008160033";

type MockPancakeRouterConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: MockPancakeRouterConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class MockPancakeRouter__factory extends ContractFactory {
  constructor(...args: MockPancakeRouterConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override getDeployTransaction(
    overrides?: NonPayableOverrides & { from?: string }
  ): Promise<ContractDeployTransaction> {
    return super.getDeployTransaction(overrides || {});
  }
  override deploy(overrides?: NonPayableOverrides & { from?: string }) {
    return super.deploy(overrides || {}) as Promise<
      MockPancakeRouter & {
        deploymentTransaction(): ContractTransactionResponse;
      }
    >;
  }
  override connect(runner: ContractRunner | null): MockPancakeRouter__factory {
    return super.connect(runner) as MockPancakeRouter__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): MockPancakeRouterInterface {
    return new Interface(_abi) as MockPancakeRouterInterface;
  }
  static connect(
    address: string,
    runner?: ContractRunner | null
  ): MockPancakeRouter {
    return new Contract(address, _abi, runner) as unknown as MockPancakeRouter;
  }
}
