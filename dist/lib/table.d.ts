import { SeatArray } from 'types/seat-array';
import { SeatIndex } from 'types/seat-index';
import { ForcedBets } from 'types/forced-bets';
import CommunityCards, { RoundOfBetting } from './community-cards';
import { Action, ActionRange } from './dealer';
import Card from './card';
import Pot from './pot';
import { HoleCards } from 'types/hole-cards';
import { Chips } from 'types/chips';
import Hand from './hand';
export declare enum AutomaticAction {
    FOLD = 1,
    CHECK_FOLD = 2,
    CHECK = 4,
    CALL = 8,
    CALL_ANY = 16,
    ALL_IN = 32
}
export default class Table {
    private readonly _numSeats;
    private readonly _tablePlayers;
    private readonly _deck;
    private _handPlayers?;
    private _initialHandPlayers?;
    private _automaticActions?;
    private _firstTimeButton;
    private _buttonSetManually;
    private _button;
    private _forcedBets;
    private _communityCards?;
    private _dealer?;
    private _staged;
    constructor(forcedBets: ForcedBets, numSeats?: number);
    playerToAct(): SeatIndex;
    button(): SeatIndex;
    seats(): SeatArray;
    handPlayers(): SeatArray;
    numActivePlayers(): number;
    initialHandPlayers(): SeatArray;
    pots(): Pot[];
    forcedBets(): ForcedBets;
    setForcedBets(forcedBets: ForcedBets): void;
    numSeats(): number;
    startHand(seat?: number): void;
    handInProgress(): boolean;
    bettingRoundInProgress(): boolean;
    bettingRoundsCompleted(): boolean;
    /**
     * Checks if the current betting round is at its very beginning with no actions taken yet.
     * This indicates that the first player to act has not yet made any decision.
     *
     * This is the main public API method for determining if you're at the initial state
     * of a betting round where no betting actions have occurred yet.
     *
     * @returns true if no actions have been taken and a betting round is in progress
     * @throws {AssertionError} if no hand is in progress
     */
    isAtStartOfBettingRound(): boolean;
    /**
     * Checks if the current betting round has actions taken but is still in progress.
     * This means at least one player has actions taken but there are still more actions required
     * before the betting round can be completed.
     *
     * This is the main public API method for determining if you're in the middle of
     * active betting where some players have acted but the round hasn't finished yet.
     *
     * @returns true if actions have been taken but the betting round is still in progress
     * @throws {AssertionError} if no hand is in progress
     */
    isInMiddleOfBettingRound(): boolean;
    roundOfBetting(): RoundOfBetting;
    communityCards(): CommunityCards;
    legalActions(): ActionRange;
    holeCards(): (HoleCards | null)[];
    actionTaken(action: Action, bet?: Chips): void;
    endBettingRound(): void;
    showdown(): void;
    setCommunityCards(cards: Card[]): void;
    setPlayerHoleCards(seatIndex: SeatIndex, cards: Card[]): void;
    manualShowdown(communityCards: Card[], playerHoleCards: Map<SeatIndex, Card[]>): void;
    winners(): [SeatIndex, Hand, HoleCards, number][][];
    automaticActions(): (AutomaticAction | null)[];
    canSetAutomaticAction(seat: SeatIndex): boolean;
    legalAutomaticActions(seat: SeatIndex): AutomaticAction;
    setAutomaticAction(seat: SeatIndex, action: AutomaticAction | null): void;
    sitDown(seat: SeatIndex, buyIn: Chips): void;
    standUp(seat: SeatIndex): void;
    private takeAutomaticAction;
    private amendAutomaticActions;
    private actPassively;
    private incrementButton;
    private clearFoldedBets;
    private updateTablePlayers;
    private singleActivePlayerRemaining;
    private standUpBustedPlayers;
}
