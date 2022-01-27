import { ethereum, BigInt, Address } from "@graphprotocol/graph-ts"
import {
  constants,
  decimals,
  events,
  transactions,
} from '@amxx/graphprotocol-utils'


import {
  TheSystem,
  TransferBatch,
  TransferSingle,
  ActivateBatch
} from "../generated/TheSystem/TheSystem"

import {
  Account,
  Token,
  Balance,
  Transfer,
  Transaction,
  Total
} from "../generated/schema"

function registerTransfer(
  theSystemContract: Address,
  event: ethereum.Event,
  suffix: string,
  operator: Account,
  from: Account,
  to: Account,
  id: BigInt,
  value: BigInt)
  : void {
  let token = fetchToken(id, theSystemContract)
  let ev = new Transfer(events.id(event).concat(suffix))
  let tots = Total.load(theSystemContract.toHexString())
  if (tots == null) {
    tots = new Total(theSystemContract.toHexString())
    tots.contractAdress = theSystemContract.toHexString()
  }
  ev.emitter = token.id
  ev.transaction = transactions.log(event).id
  ev.timestamp = event.block.timestamp
  tots.lastUpdate = event.block.timestamp
  ev.token = token.id
  ev.operator = operator.id
  ev.value = decimals.toDecimals(value)
  ev.valueExact = value

  if (from.id == constants.ADDRESS_ZERO) {
    let totalSupply = fetchBalance(token, null)
    totalSupply.valueExact = totalSupply.valueExact.plus(value)
    tots.ts = tots.ts.plus(value)
    tots.tm = tots.tm.plus(value)
    totalSupply.value = decimals.toDecimals(totalSupply.valueExact)
    totalSupply.save()

  } else {
    let balance = fetchBalance(token, from)
    balance.valueExact = balance.valueExact.minus(value)
    balance.value = decimals.toDecimals(balance.valueExact)
    balance.save()
    ev.from = from.id
    ev.fromBalance = balance.id
  }

  if (to.id == constants.ADDRESS_ZERO) {
    let totalSupply = fetchBalance(token, null)
    totalSupply.valueExact = totalSupply.valueExact.minus(value)
    tots.ts = tots.ts.minus(value)
    tots.tb = tots.tb.plus(value)
    totalSupply.value = decimals.toDecimals(totalSupply.valueExact)
    totalSupply.save()

  } else {
    let balance = fetchBalance(token, to)
    balance.valueExact = balance.valueExact.plus(value)
    balance.value = decimals.toDecimals(balance.valueExact)
    balance.save()

    ev.to = to.id
    ev.toBalance = balance.id
  }
  if ((from.id != constants.ADDRESS_ZERO) && (to.id != constants.ADDRESS_ZERO)) {
    tots.tt = tots.tt.plus(value)

  }
  tots.save()
  token.save()
  ev.save()
}

export function handleTransferBatch(event: TransferBatch): void {
  let theSystemContractAddress = event.address
  let operator = fetchAccount(event.params.operator)
  let from = fetchAccount(event.params.from)
  let to = fetchAccount(event.params.to)

  let ids = event.params.ids
  let values = event.params.values
  for (let i = 0; i < ids.length; ++i) {
    registerTransfer(
      theSystemContractAddress,
      event,
      "/".concat(i.toString()),
      operator,
      from,
      to,
      ids[i],
      values[i]
    )
  }
}

export function handleActivateBatch(event: ActivateBatch): void {
  let theSystemContractAddress = event.address
  let ids = event.params._ids
  for (let i = 0; i < ids.length; ++i) {
    let token = fetchToken(ids[i], theSystemContractAddress)
  }
}


export function handleTransferSingle(event: TransferSingle): void {
  let theSystemContractAddress = event.address
  let operator = fetchAccount(event.params.operator)
  let from = fetchAccount(event.params.from)
  let to = fetchAccount(event.params.to)

  registerTransfer(
    theSystemContractAddress,
    event,
    "",
    operator,
    from,
    to,
    event.params.id,
    event.params.value
  )

}


export function fetchToken(identifier: BigInt, theSystemContract: Address): Token {
  let id = identifier.toHex()
  let token = Token.load(id)
  let contract = TheSystem.bind(theSystemContract)
  if (token == null) {
    token = new Token(id)
    token.identifier = identifier
    token.totalSupply = fetchBalance(token as Token, null).id
    token.uri = contract.uri(identifier)
    token.save()
  }



  return token as Token
}

export function fetchBalance(token: Token, account: Account | null): Balance {
  let id = token.id.concat('/').concat(account ? account.id : 'totalSupply')
  let balance = Balance.load(id)

  if (balance == null) {
    balance = new Balance(id)
    balance.token = token.id
    balance.account = account ? account.id : null
    balance.value = constants.BIGDECIMAL_ZERO
    balance.valueExact = constants.BIGINT_ZERO
    balance.save()
  }

  return balance as Balance
}

export function fetchAccount(address: Address): Account {
  let account = new Account(address.toHex())
  account.save()
  return account
}