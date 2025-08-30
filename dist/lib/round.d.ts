import { SeatIndex } from 'types/seat-index';
export declare enum Action {
    LEAVE = 1,
    PASSIVE = 2,
    AGGRESSIVE = 4
}
export default class Round {
    private readonly _activePlayers;
    private _playerToAct;
    private _lastAggressiveActor;
    private _contested;
    private _firstAction;
    private _numActivePlayers;
    constructor(activePlayers: boolean[], firstToAct: SeatIndex);
    activePlayers(): boolean[];
    playerToAct(): SeatIndex;
    lastAggressiveActor(): SeatIndex;
    numActivePlayers(): number;
    inProgress(): boolean;
    isContested(): boolean;
    /**
     * Returns true if no actions have been taken yet in this round.
     * This indicates the round is at its initial state where the first player
     * to act has not yet made any decision.
     *
     * @returns true if this is the very start of the betting round
     */
    isFirstAction(): boolean;
    actionTaken(action: Action): void;
    private incrementPlayer;
}
