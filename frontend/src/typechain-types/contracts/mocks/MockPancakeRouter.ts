/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumberish,
  BytesLike,
  FunctionFragment,
  Result,
  Interface,
  AddressLike,
  ContractRunner,
  ContractMethod,
  Listener,
} from "ethers";
import type {
  TypedContractEvent,
  TypedDeferredTopicFilter,
  TypedEventLog,
  TypedListener,
  TypedContractMethod,
} from "../../common";

export interface MockPancakeRouterInterface extends Interface {
  getFunction(
    nameOrSignature: "addLiquidityETH" | "setAddLiquidityResult"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "addLiquidityETH",
    values: [
      AddressLike,
      BigNumberish,
      BigNumberish,
      BigNumberish,
      AddressLike,
      BigNumberish
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "setAddLiquidityResult",
    values: [BigNumberish, BigNumberish, BigNumberish]
  ): string;

  decodeFunctionResult(
    functionFragment: "addLiquidityETH",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setAddLiquidityResult",
    data: BytesLike
  ): Result;
}

export interface MockPancakeRouter extends BaseContract {
  connect(runner?: ContractRunner | null): MockPancakeRouter;
  waitForDeployment(): Promise<this>;

  interface: MockPancakeRouterInterface;

  queryFilter<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;
  queryFilter<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;

  on<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  on<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  once<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  once<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  listeners<TCEvent extends TypedContractEvent>(
    event: TCEvent
  ): Promise<Array<TypedListener<TCEvent>>>;
  listeners(eventName?: string): Promise<Array<Listener>>;
  removeAllListeners<TCEvent extends TypedContractEvent>(
    event?: TCEvent
  ): Promise<this>;

  addLiquidityETH: TypedContractMethod<
    [
      arg0: AddressLike,
      arg1: BigNumberish,
      arg2: BigNumberish,
      arg3: BigNumberish,
      arg4: AddressLike,
      arg5: BigNumberish
    ],
    [[bigint, bigint, bigint]],
    "payable"
  >;

  setAddLiquidityResult: TypedContractMethod<
    [amount0: BigNumberish, amount1: BigNumberish, liquidity: BigNumberish],
    [void],
    "nonpayable"
  >;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "addLiquidityETH"
  ): TypedContractMethod<
    [
      arg0: AddressLike,
      arg1: BigNumberish,
      arg2: BigNumberish,
      arg3: BigNumberish,
      arg4: AddressLike,
      arg5: BigNumberish
    ],
    [[bigint, bigint, bigint]],
    "payable"
  >;
  getFunction(
    nameOrSignature: "setAddLiquidityResult"
  ): TypedContractMethod<
    [amount0: BigNumberish, amount1: BigNumberish, liquidity: BigNumberish],
    [void],
    "nonpayable"
  >;

  filters: {};
}
