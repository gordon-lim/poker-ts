// Facade for the Table class that confirms with the API of https://github.com/JankoDedic/poker.js
import Table, { AutomaticAction as AutomaticActionFlag } from '../lib/table'
import { RoundOfBetting } from '../lib/community-cards'
import { CardRank, CardSuit } from '../lib/card'
import { Action as ActionFlag } from '../lib/dealer'
import ChipRange from '../lib/chip-range'
import { SeatIndex } from 'types/seat-index'
import { HandRanking } from '../lib/hand'
import { SeatArray } from 'types/seat-array'
import { convertCard } from '../util/converter'

export type Card = {
    rank: '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A'
    suit: 'clubs' | 'diamonds' | 'hearts' | 'spades'
}

export type AutomaticAction = 'fold' | 'check/fold' | 'check' | 'call' | 'call any' | 'all-in'
export type Action = 'fold' | 'check' | 'call' | 'bet' | 'raise'

const cardMapper: (card: { rank: CardRank, suit: CardSuit }) => Card = card => ({
    // @ts-ignore
    rank: CardRank[card.rank].replace(/^_/, ''),
    // @ts-ignore
    suit: CardSuit[card.suit].toLowerCase(),
})

const seatArrayMapper = player => player === null
    ? null
    : {
        totalChips: player.totalChips(),
        stack: player.stack(),
        betSize: player.betSize(),
    }

const actionFlagToStringArray = (actionFlag: ActionFlag): Action[] => {
    const actions: Action[] = []
    if (actionFlag & ActionFlag.FOLD) actions.push('fold')
    if (actionFlag & ActionFlag.CHECK) actions.push('check')
    if (actionFlag & ActionFlag.CALL) actions.push('call')
    if (actionFlag & ActionFlag.BET) actions.push('bet')
    if (actionFlag & ActionFlag.RAISE) actions.push('raise')

    return actions
}

const automaticActionFlagToStringArray = (automaticActionFlag: AutomaticActionFlag): AutomaticAction[] => {
    const automaticActions: AutomaticAction[] = []
    if (automaticActionFlag & AutomaticActionFlag.FOLD) automaticActions.push('fold')
    if (automaticActionFlag & AutomaticActionFlag.CHECK_FOLD) automaticActions.push('check/fold')
    if (automaticActionFlag & AutomaticActionFlag.CHECK) automaticActions.push('check')
    if (automaticActionFlag & AutomaticActionFlag.CALL) automaticActions.push('call')
    if (automaticActionFlag & AutomaticActionFlag.CALL_ANY) automaticActions.push('call any')
    if (automaticActionFlag & AutomaticActionFlag.ALL_IN) automaticActions.push('all-in')
    return automaticActions
}

const stringToAutomaticActionFlag = (automaticAction: AutomaticAction): AutomaticActionFlag => {
    switch (automaticAction) {
        case 'fold':
            return AutomaticActionFlag.FOLD
        case 'check/fold':
            return AutomaticActionFlag.CHECK_FOLD
        case 'check':
            return AutomaticActionFlag.CHECK
        case 'call':
            return AutomaticActionFlag.CALL
        case 'call any':
            return AutomaticActionFlag.CALL_ANY
        case 'all-in':
            return AutomaticActionFlag.ALL_IN
    }
}

export default class Poker {
    private _table: Table

    constructor(forcedBets: { ante?: number, bigBlind: number, smallBlind: number }, numSeats?: number) {
        const { ante, bigBlind: big, smallBlind: small } = forcedBets
        this._table = new Table({ ante, blinds: { big, small } }, numSeats)
    }

    playerToAct(): number {
        return this._table.playerToAct()
    }

    button(): number {
        return this._table.button()
    }

    seats(): ({ totalChips: number, stack: number, betSize: number } | null)[] {
        return this._table.seats().map(seatArrayMapper)
    }

    handPlayers(): ({ totalChips: number, stack: number, betSize: number } | null)[] {
        return this._table.handPlayers().map(seatArrayMapper)
    }

    numActivePlayers(): number {
        return this._table.numActivePlayers()
    }

    initialHandPlayers(): SeatArray {
        return this._table.initialHandPlayers()
    }

    pots(): { size: number, eligiblePlayers: number[] }[] {
        return this._table.pots().map(pot => ({
            size: pot.size(),
            eligiblePlayers: pot.eligiblePlayers(),
        }))
    }

    forcedBets(): { ante: number, bigBlind: number, smallBlind: number } {
        const { ante = 0, blinds: { big: bigBlind, small: smallBlind } } = this._table.forcedBets()
        return {
            ante,
            smallBlind,
            bigBlind,
        }
    }

    setForcedBets(forcedBets: { ante?: number, bigBlind: number, smallBlind: number }): void {
        const { ante, bigBlind: big, smallBlind: small } = forcedBets
        this._table.setForcedBets({ ante, blinds: { small, big } })
    }

    numSeats(): number {
        return this._table.numSeats()
    }

    startHand(seat?: number): void {
        this._table.startHand(seat)
    }

    isHandInProgress(): boolean {
        return this._table.handInProgress()
    }

    isBettingRoundInProgress(): boolean {
        return this._table.bettingRoundInProgress()
    }

    areBettingRoundsCompleted(): boolean {
        return this._table.bettingRoundsCompleted()
    }

    /**
     * Checks if the current betting round is at its very beginning with no actions taken yet.
     * This indicates that the first player to act has not yet made any decision.
     * 
     * @returns true if no actions have been taken and a betting round is in progress
     */
    isAtStartOfBettingRound(): boolean {
        return this._table.isAtStartOfBettingRound()
    }

    /**
     * Checks if the current betting round has actions taken but is still in progress.
     * This means at least one player has acted but there are still more actions required
     * before the betting round can be completed.
     * 
     * @returns true if actions have been taken but the betting round is still in progress
     */
    isInMiddleOfBettingRound(): boolean {
        return this._table.isInMiddleOfBettingRound()
    }

    roundOfBetting(): 'preflop' | 'flop' | 'turn' | 'river' {
        const rob = this._table.roundOfBetting()
        // @ts-ignore
        return RoundOfBetting[rob].toLowerCase()
    }

    communityCards(): Card[] {
        return this._table.communityCards().cards().map(cardMapper)
    }

    legalActions(): { actions: Action[], chipRange?: ChipRange } {
        const { action, chipRange } = this._table.legalActions()
        return {
            actions: actionFlagToStringArray(action),
            chipRange,
        }
    }

    holeCards(): (Card[] | null)[] {
        return this._table.holeCards().map(cards => {
            return cards === null
                ? null
                : cards.map(cardMapper)
        })
    }

    actionTaken(action: 'fold' | 'check' | 'call' | 'bet' | 'raise', betSize?: number) {
        this._table.actionTaken(ActionFlag[action.toUpperCase()], betSize)
    }

    endBettingRound(): void {
        this._table.endBettingRound()
    }

    showdown(): void {
        this._table.showdown()
    }
    // Add these methods after the existing showdown method (around line 177)
    setCommunityCards(cards: Card[]): void {
        const internalCards = cards.map(convertCard)
        this._table.setCommunityCards(internalCards)
    }

    setPlayerHoleCards(seatIndex: number, cards: Card[]): void {
        const internalCards = cards.map(convertCard)
        this._table.setPlayerHoleCards(seatIndex, internalCards)
    }

    manualShowdown(communityCards: Card[], playerHoleCards: { [seatIndex: number]: Card[] }): void {
        const internalCommunityCards = communityCards.map(convertCard)
        const playerCardsMap = new Map()
        Object.entries(playerHoleCards).forEach(([seatIndex, cards]) => {
            playerCardsMap.set(parseInt(seatIndex), cards.map(convertCard))
        })
        
        this._table.manualShowdown(internalCommunityCards, playerCardsMap)
    }

    winners(): [SeatIndex, { cards: Card[], ranking: HandRanking, strength: number }, Card[]][][] {
        return this._table.winners().map(potWinners => potWinners.map(winner => {
            const [seatIndex, hand, holeCards] = winner
            return [
                seatIndex,
                {
                    cards: hand.cards().map(cardMapper),
                    ranking: hand.ranking(),
                    strength: hand.strength(),
                },
                holeCards.map(cardMapper),
            ]
        }))
    }

    automaticActions(): (AutomaticAction | null)[] {
        return this._table.automaticActions().map(action => {
            return action === null
                ? null
                : automaticActionFlagToStringArray(action)[0]
        })
    }

    canSetAutomaticActions(seatIndex: number): boolean {
        return this._table.canSetAutomaticAction(seatIndex)
    }

    legalAutomaticActions(seatIndex: number): AutomaticAction[] {
        const automaticActionFlag = this._table.legalAutomaticActions(seatIndex)
        return automaticActionFlagToStringArray(automaticActionFlag)
    }

    setAutomaticAction(seatIndex: number, action: AutomaticAction | null): void {
        const automaticAction = action === null ? action : stringToAutomaticActionFlag(action)
        this._table.setAutomaticAction(seatIndex, automaticAction)
    }

    sitDown(seatIndex: number, buyIn: number): void {
        this._table.sitDown(seatIndex, buyIn)
    }

    standUp(seatIndex: number): void {
        this._table.standUp(seatIndex)
    }
}
