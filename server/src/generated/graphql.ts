/* eslint-disable @typescript-eslint/no-empty-object-type */
import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Date: { input: any; output: any; }
};

export type Address = {
  __typename?: 'Address';
  city: Scalars['String']['output'];
  country: Scalars['String']['output'];
  postalCode: Scalars['String']['output'];
  state: Scalars['String']['output'];
  street: Scalars['String']['output'];
};

export type BillingInfo = {
  __typename?: 'BillingInfo';
  address: Address;
  phoneNumber: Scalars['String']['output'];
};

export type Device = {
  __typename?: 'Device';
  browser: Scalars['String']['output'];
  deviceId: Scalars['String']['output'];
  deviceType: Scalars['String']['output'];
  ipAddress: Scalars['String']['output'];
  lastLogin: Scalars['Date']['output'];
  os: Scalars['String']['output'];
  platform: Scalars['String']['output'];
  version: Scalars['String']['output'];
};

export type LoginAttempt = {
  __typename?: 'LoginAttempt';
  count: Scalars['Int']['output'];
  lastLogin: Scalars['Date']['output'];
};

export type LoginInput = {
  email?: InputMaybe<Scalars['String']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  loginUser: User;
  registerUser: User;
};


export type MutationLoginUserArgs = {
  user: LoginInput;
};


export type MutationRegisterUserArgs = {
  user: RegisterInput;
};

export type Query = {
  __typename?: 'Query';
  getUser: User;
};


export type QueryGetUserArgs = {
  _id: Scalars['ID']['input'];
};

export type RegisterInput = {
  email?: InputMaybe<Scalars['String']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
  profilePicture?: InputMaybe<Scalars['String']['input']>;
};

export type User = {
  __typename?: 'User';
  _id: Scalars['ID']['output'];
  account: Array<UserAccountEnum>;
  billingInfo?: Maybe<BillingInfo>;
  createdAt: Scalars['Date']['output'];
  deactivateReason?: Maybe<Scalars['String']['output']>;
  deactivateTime?: Maybe<Scalars['Date']['output']>;
  devices?: Maybe<Array<Device>>;
  email: Scalars['String']['output'];
  firstName: Scalars['String']['output'];
  githubId?: Maybe<Scalars['String']['output']>;
  googleId?: Maybe<Scalars['String']['output']>;
  isBlocked: Scalars['Boolean']['output'];
  isDeactivated: Scalars['Boolean']['output'];
  isVerified: Scalars['Boolean']['output'];
  lastName: Scalars['String']['output'];
  latestSubscription?: Maybe<Scalars['ID']['output']>;
  loginAttempt?: Maybe<LoginAttempt>;
  password?: Maybe<Scalars['String']['output']>;
  phoneNumber?: Maybe<Scalars['String']['output']>;
  profilePicture?: Maybe<Scalars['String']['output']>;
  role: UserRoleEnum;
  updatedAt: Scalars['Date']['output'];
};

export enum UserAccountEnum {
  Email = 'EMAIL',
  Github = 'GITHUB',
  Google = 'GOOGLE'
}

export enum UserRoleEnum {
  Admin = 'ADMIN',
  User = 'USER'
}



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;



/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Address: ResolverTypeWrapper<Address>;
  BillingInfo: ResolverTypeWrapper<BillingInfo>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  Date: ResolverTypeWrapper<Scalars['Date']['output']>;
  Device: ResolverTypeWrapper<Device>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  LoginAttempt: ResolverTypeWrapper<LoginAttempt>;
  LoginInput: LoginInput;
  Mutation: ResolverTypeWrapper<{}>;
  Query: ResolverTypeWrapper<{}>;
  RegisterInput: RegisterInput;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  User: ResolverTypeWrapper<User>;
  UserAccountEnum: UserAccountEnum;
  UserRoleEnum: UserRoleEnum;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Address: Address;
  BillingInfo: BillingInfo;
  Boolean: Scalars['Boolean']['output'];
  Date: Scalars['Date']['output'];
  Device: Device;
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  LoginAttempt: LoginAttempt;
  LoginInput: LoginInput;
  Mutation: {};
  Query: {};
  RegisterInput: RegisterInput;
  String: Scalars['String']['output'];
  User: User;
};

export type AddressResolvers<ContextType = any, ParentType extends ResolversParentTypes['Address'] = ResolversParentTypes['Address']> = {
  city?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  country?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  postalCode?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  state?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  street?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BillingInfoResolvers<ContextType = any, ParentType extends ResolversParentTypes['BillingInfo'] = ResolversParentTypes['BillingInfo']> = {
  address?: Resolver<ResolversTypes['Address'], ParentType, ContextType>;
  phoneNumber?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface DateScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Date'], any> {
  name: 'Date';
}

export type DeviceResolvers<ContextType = any, ParentType extends ResolversParentTypes['Device'] = ResolversParentTypes['Device']> = {
  browser?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  deviceId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  deviceType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  ipAddress?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  lastLogin?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  os?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  platform?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  version?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type LoginAttemptResolvers<ContextType = any, ParentType extends ResolversParentTypes['LoginAttempt'] = ResolversParentTypes['LoginAttempt']> = {
  count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  lastLogin?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  loginUser?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationLoginUserArgs, 'user'>>;
  registerUser?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationRegisterUserArgs, 'user'>>;
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  getUser?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<QueryGetUserArgs, '_id'>>;
};

export type UserResolvers<ContextType = any, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  account?: Resolver<Array<ResolversTypes['UserAccountEnum']>, ParentType, ContextType>;
  billingInfo?: Resolver<Maybe<ResolversTypes['BillingInfo']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  deactivateReason?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  deactivateTime?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  devices?: Resolver<Maybe<Array<ResolversTypes['Device']>>, ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  firstName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  githubId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  googleId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  isBlocked?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isDeactivated?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isVerified?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  lastName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  latestSubscription?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  loginAttempt?: Resolver<Maybe<ResolversTypes['LoginAttempt']>, ParentType, ContextType>;
  password?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  phoneNumber?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  profilePicture?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  role?: Resolver<ResolversTypes['UserRoleEnum'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = any> = {
  Address?: AddressResolvers<ContextType>;
  BillingInfo?: BillingInfoResolvers<ContextType>;
  Date?: GraphQLScalarType;
  Device?: DeviceResolvers<ContextType>;
  LoginAttempt?: LoginAttemptResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
};

