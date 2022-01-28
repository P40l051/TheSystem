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
  let tots = fetchTotal(null, null)
  let totsToken = fetchTotal(null, token)

  if (event.block.timestamp != tots.timestamp) {
    let totsl = fetchTotal(event.block.timestamp.toString(), null)
    let totsTokenl = fetchTotal(event.block.timestamp.toString(), token)
    totsl.timestamp = event.block.timestamp
    totsTokenl.timestamp = event.block.timestamp

    if (from.id == constants.ADDRESS_ZERO) {
      totsl.ts = tots.ts.plus(value)
      totsl.tm = tots.tm.plus(value)
      totsl.tb = tots.tb
      totsl.tt = tots.tt
      totsTokenl.ts = totsToken.ts.plus(value)
      totsTokenl.tm = totsToken.tm.plus(value)
      totsTokenl.tb = totsToken.tb
      totsTokenl.tt = totsToken.tt
    }
    else if (to.id == constants.ADDRESS_ZERO) {
      totsl.ts = tots.ts.minus(value)
      totsl.tm = tots.tm
      totsl.tb = tots.tb.plus(value)
      totsl.tt = tots.tt
      totsTokenl.ts = totsToken.ts.minus(value)
      totsTokenl.tm = totsToken.tm
      totsTokenl.tb = totsToken.tb.plus(value)
      totsTokenl.tt = totsToken.tt
    }
    else if ((from.id != constants.ADDRESS_ZERO) && (to.id != constants.ADDRESS_ZERO)) {
      totsl.ts = tots.ts
      totsl.tm = tots.tm
      totsl.tb = tots.tb
      totsl.tt = tots.tt.plus(value)
      totsTokenl.ts = totsToken.ts
      totsTokenl.tm = totsToken.tm
      totsTokenl.tb = totsToken.tb
      totsTokenl.tt = totsToken.tt.plus(value)
    }
    totsl.save()
    totsTokenl.save()
  }
  ev.emitter = token.id
  ev.transaction = transactions.log(event).id
  ev.timestamp = event.block.timestamp
  tots.timestamp = event.block.timestamp
  ev.token = token.id
  ev.operator = operator.id
  ev.value = decimals.toDecimals(value)
  ev.valueExact = value

  if (from.id == constants.ADDRESS_ZERO) {
    let totalSupply = fetchBalance(token, null)
    totalSupply.valueExact = totalSupply.valueExact.plus(value)
    tots.ts = tots.ts.plus(value)
    tots.tm = tots.tm.plus(value)
    totsToken.ts = totsToken.ts.plus(value)
    totsToken.tm = totsToken.tm.plus(value)
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
    totsToken.ts = totsToken.ts.minus(value)
    totsToken.tb = totsToken.tb.plus(value)
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
    totsToken.tt = totsToken.tt.plus(value)
  }
  tots.save()
  totsToken.save()
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

export function fetchTotal(timestamp: String | null, token: Token | null): Total {
  let id = (timestamp ? timestamp : 'last').concat('/').concat(token ? token.id : 'contract')
  let total = Total.load(id)
  if (total == null) {
    total = new Total(id)
    total.filter = id
    total.token = token ? token.id : null
    total.save()
  }
  return total as Total
}

export function fetchAccount(address: Address): Account {
  let account = new Account(address.toHex())
  account.save()
  return account
}