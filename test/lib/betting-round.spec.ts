import BettingRound, { Action as BettingRoundAction } from '../../src/lib/betting-round'
import { SeatArray } from '../../src/types/seat-array'
import Player from '../../src/lib/player'
import Round, { Action as RoundAction } from '../../src/lib/round'

describe('Betting round', () => {
    describe('testing valid actions', () => {
        describe('a betting round', () => {
            let players: SeatArray
            let round: BettingRound
            beforeEach(() => {
                players = new Array(9).fill(null)
                players[0] = new Player(1)
                players[1] = new Player(1)
                players[2] = new Player(1)
                round = new BettingRound(players, 0, 50, 50)
            })

            test('precondition', () => {
                expect(round.playerToAct()).toBe(0)
                expect(round.biggestBet()).toBe(50)
                expect(round.minRaise()).toBe(50)
            })

            describe('the player has less chips than the biggest bet', () => {
                beforeEach(() => {
                    players[0] = new Player(25)
                })

                test('precondition', () => {
                    expect(players[0]?.totalChips()).toBeLessThan(round.biggestBet())
                })

                test('he/she cannot raise', () => {
                    const actions = round.legalActions()
                    expect(actions.canRaise).toBeFalsy()
                })
            })

            describe('the player has amount of chips equal to the biggest bet', () => {
                beforeEach(() => {
                    players[0] = new Player(50)
                })

                test('precondition', () => {
                    expect(players[0]?.totalChips()).toBe(round.biggestBet())
                })

                test('he/she cannot raise', () => {
                    const actions = round.legalActions()
                    expect(actions.canRaise).toBeFalsy()
                })
            })

            describe('the player has more chips than the biggest bet and less than minimum re-raise bet', () => {
                beforeEach(() => {
                    players[0] = new Player(75)
                })

                test('precondition', () => {
                    expect(players[0]?.totalChips()).toBeGreaterThan(round.biggestBet())
                    expect(players[0]?.totalChips()).toBeLessThan(round.biggestBet() + round.minRaise())
                })

                test('he can raise, but only his entire stack', () => {
                    const action = round.legalActions()
                    expect(action.canRaise).toBeTruthy()
                    expect(action.chipRange).toBeDefined()
                    expect(action.chipRange?.min).toBe(players[0]?.totalChips())
                    expect(action.chipRange?.max).toBe(players[0]?.totalChips())
                })
            })

            describe('the player has amount of chips equal to the minimum re-raise bet', () => {
                beforeEach(() => {
                    players[0] = new Player(100)
                })

                test('precondition', () => {
                    expect(players[0]?.totalChips()).toBe(round.biggestBet() + round.minRaise())
                })

                test('he can raise, but only his entire stack', () => {
                    const action = round.legalActions()
                    expect(action.canRaise).toBeTruthy()
                    expect(action.chipRange).toBeDefined()
                    expect(action.chipRange?.min).toBe(players[0]?.totalChips())
                    expect(action.chipRange?.max).toBe(players[0]?.totalChips())
                })
            })

            describe('the player has more chips than the minimum re-raise bet', () => {
                beforeEach(() => {
                    players[0] = new Player(150)
                })

                test('precondition', () => {
                    expect(players[0]?.totalChips()).toBeGreaterThan(round.biggestBet() + round.minRaise())
                })

                test('he/she can raise any amount ranging from min re-raise to his entire stack', () => {
                    const action = round.legalActions()
                    expect(action.canRaise).toBeTruthy()
                    expect(action.chipRange).toBeDefined()
                    expect(players[0]).toBeDefined()


                    expect(action.chipRange?.min).toBe(round.biggestBet() + round.minRaise())
                    expect(action.chipRange?.max).toBe(players[0]?.totalChips())
                })
            })
        })
    })

    describe('betting round actions map to round actions properly', () => {
        describe('a betting round', () => {
            let players: SeatArray
            let round: Round
            let bettingRound: BettingRound
            beforeEach(() => {
                players = new Array(9).fill(null)
                players[0] = new Player(1000)
                players[1] = new Player(1000)
                players[2] = new Player(1000)
                round = new Round(players.map(player => !!player), 0)
                bettingRound = new BettingRound(players, 0, 50, 50)
            })

            test('precondition', () => {
                expect(round).toEqual(bettingRound['_round'])
                expect(bettingRound.playerToAct()).toBe(0)
            })

            describe('a player raises for less than his entire stack', () => {
                beforeEach(() => {
                    bettingRound.actionTaken(BettingRoundAction.RAISE, 200)
                })

                test('precondition', () => {
                    expect(players[0]?.stack()).toBeGreaterThan(0)
                })

                test('he made an aggressive action', () => {
                    round.actionTaken(RoundAction.AGGRESSIVE)
                    expect(round).toEqual(bettingRound['_round'])
                })
            })

            describe('a player raises his entire stack', () => {
                beforeEach(() => {
                    bettingRound.actionTaken(BettingRoundAction.RAISE, 1000)
                })

                test('precondition', () => {
                    expect(players[0]?.stack()).toBe(0)
                })

                test('he/she made an aggressive action and left the round', () => {
                    round.actionTaken(RoundAction.AGGRESSIVE | RoundAction.LEAVE)
                    expect(round).toEqual(bettingRound['_round'])
                })
            })

            describe('a player matches for less than his entire stack', () => {
                beforeEach(() => {
                    bettingRound.actionTaken(BettingRoundAction.MATCH)
                })

                test('precondition', () => {
                    expect(players[0]?.stack()).toBeGreaterThan(0)
                })

                test('he/she made a passive action', () => {
                    round.actionTaken(RoundAction.PASSIVE)
                    expect(round).toEqual(bettingRound['_round'])
                })
            })

            describe('a player matches for his entire stack', () => {
                beforeEach(() => {
                    players[0] = new Player(50)
                    bettingRound.actionTaken(BettingRoundAction.MATCH)
                })

                test('precondition', () => {
                    expect(players[0]?.stack()).toBe(0)
                })

                test('he/she made a passive action and left the round', () => {
                    round.actionTaken(RoundAction.PASSIVE | RoundAction.LEAVE)
                    expect(round).toEqual(bettingRound['_round'])
                })
            })

            describe('a player leaves', () => {
                beforeEach(() => {
                    bettingRound.actionTaken(BettingRoundAction.LEAVE)
                })

                test('he left the round', () => {
                    round.actionTaken(RoundAction.LEAVE)
                    expect(round).toEqual(bettingRound['_round'])
                })
            })
        })
    })

    describe('betting round state checking functions', () => {
        let players: SeatArray
        let bettingRound: BettingRound

        beforeEach(() => {
            players = new Array(9).fill(null)
            players[0] = new Player(1000) // Player at seat 0 with 1000 chips
            players[1] = new Player(1000) // Player at seat 1 with 1000 chips
            players[2] = new Player(1000) // Player at seat 2 with 1000 chips
            // Create a betting round starting with player 0, min raise 50, biggest bet 0 (no blinds)
            bettingRound = new BettingRound(players, 0, 50, 0)
        })

        describe('isAtStartOfBettingRound()', () => {
            test('returns true when betting round just started and no actions taken', () => {
                // Initially, no actions have been taken
                expect(bettingRound.inProgress()).toBe(true)
                expect(bettingRound.isAtStartOfBettingRound()).toBe(true)
                expect(bettingRound.isInMiddleOfBettingRound()).toBe(false)
            })

            test('returns false after first action is taken', () => {
                // Take first action (player 0 folds)
                bettingRound.actionTaken(BettingRoundAction.LEAVE)
                
                expect(bettingRound.inProgress()).toBe(true) // Still in progress
                expect(bettingRound.isAtStartOfBettingRound()).toBe(false)
                expect(bettingRound.isInMiddleOfBettingRound()).toBe(true)
            })

            test('returns false when betting round is not in progress', () => {
                // Make all players fold except one to end the round
                bettingRound.actionTaken(BettingRoundAction.LEAVE) // Player 0 folds
                bettingRound.actionTaken(BettingRoundAction.LEAVE) // Player 1 folds
                // Now only player 2 remains, round should end
                
                expect(bettingRound.inProgress()).toBe(false)
                expect(bettingRound.isAtStartOfBettingRound()).toBe(false)
                expect(bettingRound.isInMiddleOfBettingRound()).toBe(false)
            })
        })

        describe('isInMiddleOfBettingRound()', () => {
            test('returns false when betting round just started', () => {
                expect(bettingRound.isInMiddleOfBettingRound()).toBe(false)
                expect(bettingRound.isAtStartOfBettingRound()).toBe(true)
            })

            test('returns true after first action but round still in progress', () => {
                // Player 0 calls (matches current bet)
                bettingRound.actionTaken(BettingRoundAction.MATCH)
                
                expect(bettingRound.inProgress()).toBe(true)
                expect(bettingRound.isInMiddleOfBettingRound()).toBe(true)
                expect(bettingRound.isAtStartOfBettingRound()).toBe(false)
            })

            test('returns true after multiple actions while round continues', () => {
                // Player 0 calls
                bettingRound.actionTaken(BettingRoundAction.MATCH)
                // Player 1 raises
                bettingRound.actionTaken(BettingRoundAction.RAISE, 100)
                
                expect(bettingRound.inProgress()).toBe(true)
                expect(bettingRound.isInMiddleOfBettingRound()).toBe(true)
                expect(bettingRound.isAtStartOfBettingRound()).toBe(false)
            })

            test('returns false when betting round ends', () => {
                // Make all players fold except one
                bettingRound.actionTaken(BettingRoundAction.LEAVE) // Player 0 folds
                bettingRound.actionTaken(BettingRoundAction.LEAVE) // Player 1 folds
                
                expect(bettingRound.inProgress()).toBe(false)
                expect(bettingRound.isInMiddleOfBettingRound()).toBe(false)
                expect(bettingRound.isAtStartOfBettingRound()).toBe(false)
            })
        })

        describe('state transitions', () => {
            test('proper state transition from start to middle to end', () => {
                // Initial state: at start
                expect(bettingRound.isAtStartOfBettingRound()).toBe(true)
                expect(bettingRound.isInMiddleOfBettingRound()).toBe(false)
                expect(bettingRound.inProgress()).toBe(true)

                // After first action: in middle
                bettingRound.actionTaken(BettingRoundAction.MATCH) // Player 0 calls
                expect(bettingRound.isAtStartOfBettingRound()).toBe(false)
                expect(bettingRound.isInMiddleOfBettingRound()).toBe(true)
                expect(bettingRound.inProgress()).toBe(true)

                // After more actions: still in middle
                bettingRound.actionTaken(BettingRoundAction.RAISE, 100) // Player 1 raises
                expect(bettingRound.isAtStartOfBettingRound()).toBe(false)
                expect(bettingRound.isInMiddleOfBettingRound()).toBe(true)
                expect(bettingRound.inProgress()).toBe(true)

                // End the round: neither start nor middle
                bettingRound.actionTaken(BettingRoundAction.MATCH) // Player 2 calls
                bettingRound.actionTaken(BettingRoundAction.MATCH) // Player 0 calls the raise
                // Round should end after player 1 (who made the last aggressive action)
                
                expect(bettingRound.isAtStartOfBettingRound()).toBe(false)
                expect(bettingRound.isInMiddleOfBettingRound()).toBe(false)
                expect(bettingRound.inProgress()).toBe(false)
            })
        })

        describe('edge cases', () => {
            test('with pre-existing biggest bet (like big blind scenario)', () => {
                // Create a round with existing biggest bet (simulating big blind)
                const roundWithBlinds = new BettingRound(players, 0, 50, 100)
                
                expect(roundWithBlinds.isAtStartOfBettingRound()).toBe(true)
                expect(roundWithBlinds.isInMiddleOfBettingRound()).toBe(false)
                
                // First action
                roundWithBlinds.actionTaken(BettingRoundAction.MATCH)
                expect(roundWithBlinds.isAtStartOfBettingRound()).toBe(false)
                expect(roundWithBlinds.isInMiddleOfBettingRound()).toBe(true)
            })

            test('single player scenario', () => {
                // Create round with only one active player
                const singlePlayerArray: SeatArray = new Array(9).fill(null)
                singlePlayerArray[0] = new Player(1000)
                const singlePlayerRound = new BettingRound(singlePlayerArray, 0, 50, 0)
                
                // With only one player, round should not be in progress
                expect(singlePlayerRound.inProgress()).toBe(false)
                expect(singlePlayerRound.isAtStartOfBettingRound()).toBe(false)
                expect(singlePlayerRound.isInMiddleOfBettingRound()).toBe(false)
            })
        })
    })
})