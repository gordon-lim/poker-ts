import { SeatArray } from 'types/seat-array';
import { SeatIndex } from 'types/seat-index';
import ChipRange from './chip-range';
import { Chips } from 'types/chips';
import { ForcedBets } from 'types/forced-bets';
import Deck from './deck';
import CommunityCards, { RoundOfBetting } from './community-cards';
import { HoleCards } from 'types/hole-cards';
import Pot from './pot';
import Hand from './hand';
import Card from './card';
export declare class ActionRange {
    action: Action;
    chipRange?: ChipRange;
    constructor(chipRange?: ChipRange);
    contains(action: Action, bet?: Chips): boolean;
}
export declare enum Action {
    FOLD = 1,
    CHECK = 2,
    CALL = 4,
    BET = 8,
    RAISE = 16
}
export default class Dealer {
    private readonly _button;
    _communityCards: CommunityCards;
    private _holeCards;
    private _players;
    private _bettingRound;
    private _forcedBets;
    private _deck;
    private _handInProgress;
    private _roundOfBetting;
    private _bettingRoundsCompleted;
    private _potManager;
    private _winners;
    constructor(players: SeatArray, button: SeatIndex, forcedBets: ForcedBets, deck: Deck, communityCards: CommunityCards, numSeats?: number);
    static isValid(action: Action): boolean;
    static isAggressive(action: Action): boolean;
    handInProgress(): boolean;
    bettingRoundsCompleted(): boolean;
    playerToAct(): SeatIndex;
    players(): SeatArray;
    bettingRoundPlayers(): SeatArray;
    roundOfBetting(): RoundOfBetting;
    numActivePlayers(): number;
    biggestBet(): Chips;
    bettingRoundInProgress(): boolean;
    isContested(): boolean;
    legalActions(): ActionRange;
    pots(): Pot[];
    button(): SeatIndex;
    holeCards(): HoleCards[];
    startHand(): void;
    actionTaken(action: Action, bet?: Chips): void;
    endBettingRound(): void;
    winners(): [SeatIndex, Hand, HoleCards][][];
    setCommunityCards(cards: Card[]): void;
    setHoleCards(seatIndex: SeatIndex, cards: Card[]): void;
    manualShowdown(communityCards: Card[], playerHoleCards: Map<SeatIndex, Card[]>): void;
    showdown(): void;
    private evaluateAndDistributePots;
    private nextOrWrap;
    private collectAnte;
    private postBlinds;
    private dealHoleCards;
    private dealCommunityCards;
}
