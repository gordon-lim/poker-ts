import Table, { AutomaticAction } from '../../src/lib/table'
import { Action } from '../../src/lib/dealer'
import Card, {CardRank, CardSuit} from '../../src/lib/card'
import { HandRanking } from '../../src/lib/hand'
import { RoundOfBetting } from '../../src/lib/community-cards'

describe('Table', () => {
    let table: Table

    beforeEach(() => {
        table = new Table({ blinds: { big: 50, small: 25 } })
    })

    test('table construction', () => {
        expect(table.seats()).toEqual(new Array(9).fill(null))
        expect(table.forcedBets()).toEqual({ blinds: { big: 50, small: 25 } })
        expect(table.numSeats()).toBe(9)
        expect(table.handInProgress()).toBeFalsy()
    })

    test('setting forced bets ', () => {
        table.setForcedBets({ blinds: { big: 200, small: 100 } })
        expect(table.forcedBets()).toEqual({ blinds: { big: 200, small: 100 } })
    })

    test('moving the button between hands', () => {
        table.sitDown(2, 2000)
        table.sitDown(3, 2000)
        table.sitDown(4, 2000)
        table.startHand()
        expect(table.button()).toBe(2)
        table.actionTaken(Action.FOLD)
        table.actionTaken(Action.FOLD)
        table.endBettingRound()
        table.showdown()
        expect(table.handInProgress()).toBeFalsy()

        // Start a new hand
        table.startHand()

        // Button jumped to the next present player
        expect(table.button()).toBe(3)
    })

    describe('adding/removing players', () => {
        describe('a table with no hand in play', () => {
            describe('a player takes a seat', () => {
                beforeEach(() => {
                    table.sitDown(7, 1000)
                })

                test('that seat is taken', () => {
                    expect(table.seats()[7]).not.toBeNull()
                })
            })
        })

        describe('a table with one player seated and no hand in play', () => {
            beforeEach(() => {
                table.sitDown(7, 1000)
            })

            describe('that player stands up', () => {
                beforeEach(() => {
                    table.standUp(7)
                })

                test('the seat opens up', () => {
                    expect(table.seats()[7]).toBeNull()
                })
            })
        })

        describe('a table with three players active in the hand which is in progress', () => {
            beforeEach(() => {
                table.sitDown(4, 2000)
                table.sitDown(5, 2000)
                table.sitDown(6, 2000)
                table.startHand()
            })

            test('precondition', () => {
                expect(table.bettingRoundInProgress()).toBeTruthy()
                expect(table.playerToAct()).toBe(4)
            })

            // More than one player remain sitting
            describe('one of them stands up', () => {
                beforeEach(() => {
                    table.standUp(5)
                })

                test('the betting round is still in progress', () => {
                    expect(table.bettingRoundInProgress()).toBeTruthy()
                })
            })

            // One player remains sitting
            describe('two of them stand up', () => {
                beforeEach(() => {
                    table.standUp(4)
                })

                test('precondition', () => {
                    expect(table.playerToAct()).toBe(5)
                })

                describe('second player stands up', () => {
                    beforeEach(() => {
                        table.standUp(6)
                    })

                    test('the betting round is over', () => {
                        expect(table.bettingRoundInProgress()).toBeFalsy()
                    })
                })

            })

        })

        describe('a table with a few active players in a hand which is in progress', () => {
            beforeEach(() => {
                table.sitDown(4, 2000)
                table.sitDown(5, 2000)
                table.sitDown(6, 2000)
                table.startHand()
            })

            describe('a player stands up', () => {
                beforeEach(() => {
                    table.standUp(6)
                })

                test('his/her automatic action is set to fold', () => {
                    expect(table.automaticActions()[6]).toBe(AutomaticAction.FOLD)
                })
            })

            // Immediate fold
            describe('the player to act stands up', () => {
                test('precondition', () => {
                    expect(table.playerToAct()).toBe(4)
                    expect(table.numActivePlayers()).toBe(3)
                })

                describe('player stands up', () => {
                    beforeEach(() => {
                        table.standUp(4)
                    })

                    test('his action counts as a fold', () => {
                        expect(table.playerToAct()).toBe(5)
                        expect(table.numActivePlayers()).toBe(2)
                    })
                })
            })
        })
    })

    describe('automatic actions', () => {
        describe('three players sit down and the hand begins', () => {
            beforeEach(() => {
                table.sitDown(1, 2000)
                table.sitDown(2, 2000)
                table.sitDown(3, 2000)
                table.startHand()
            })

            test('the legal actions for each player are appropriate', () => {
                expect(table.seats()[1]?.betSize()).toBe(0)
                expect(table.seats()[2]?.betSize()).toBe(25)
                expect(table.seats()[3]?.betSize()).toBe(50)

                let legalAutomaticActions = table.legalAutomaticActions(1)
                expect(legalAutomaticActions & AutomaticAction.FOLD).toBeTruthy()
                expect(legalAutomaticActions & AutomaticAction.CHECK_FOLD).toBeFalsy()
                expect(legalAutomaticActions & AutomaticAction.CHECK).toBeFalsy()
                expect(legalAutomaticActions & AutomaticAction.CALL).toBeTruthy()
                expect(legalAutomaticActions & AutomaticAction.CALL_ANY).toBeTruthy()
                expect(legalAutomaticActions & AutomaticAction.ALL_IN).toBeTruthy()

                legalAutomaticActions = table.legalAutomaticActions(2)
                expect(legalAutomaticActions & AutomaticAction.FOLD).toBeTruthy()
                expect(legalAutomaticActions & AutomaticAction.CHECK_FOLD).toBeFalsy()
                expect(legalAutomaticActions & AutomaticAction.CHECK).toBeFalsy()
                expect(legalAutomaticActions & AutomaticAction.CALL).toBeTruthy()
                expect(legalAutomaticActions & AutomaticAction.CALL_ANY).toBeTruthy()
                expect(legalAutomaticActions & AutomaticAction.ALL_IN).toBeTruthy()

                legalAutomaticActions = table.legalAutomaticActions(3)
                expect(legalAutomaticActions & AutomaticAction.FOLD).toBeTruthy()
                expect(legalAutomaticActions & AutomaticAction.CHECK_FOLD).toBeTruthy()
                expect(legalAutomaticActions & AutomaticAction.CHECK).toBeTruthy()
                expect(legalAutomaticActions & AutomaticAction.CALL).toBeFalsy()
                expect(legalAutomaticActions & AutomaticAction.CALL_ANY).toBeTruthy()
                expect(legalAutomaticActions & AutomaticAction.ALL_IN).toBeTruthy()
            })
        })

        describe('a table with a game that has just begun', () => {
            beforeEach(() => {
                table.sitDown(1, 2000)
                table.sitDown(2, 2000)
                table.sitDown(3, 2000)
                table.startHand()
            })

            describe('SB and BB set their automatic actions', () => {
                beforeEach(() => {
                    table.setAutomaticAction(2, AutomaticAction.CALL)
                    table.setAutomaticAction(3, AutomaticAction.ALL_IN)
                })

                test('the table state reflects that', () => {
                    expect(table.automaticActions()[2]).toBe(AutomaticAction.CALL)
                    expect(table.automaticActions()[3]).toBe(AutomaticAction.ALL_IN)
                })

                test('reset automatic action', () => {
                    table.setAutomaticAction(2, null)
                    expect(table.automaticActions()[2]).toBe(null)
                })
            })
        })

        describe('a table with a game that has just begun where SB and BB have set their automatic actions to call/check', () => {
            beforeEach(() => {
                table.sitDown(1, 2000)
                table.sitDown(2, 2000)
                table.sitDown(3, 2000)
                table.startHand()
                table.setAutomaticAction(2, AutomaticAction.CALL)
                table.setAutomaticAction(3, AutomaticAction.CHECK)
            })

            describe('the player to act calls', () => {
                beforeEach(() => {
                    table.actionTaken(Action.CALL)
                })

                test('the automatic actions play out', () => {
                    expect(table.seats()[1]?.betSize()).toBe(50)
                    expect(table.seats()[2]?.betSize()).toBe(50)
                    expect(table.seats()[3]?.betSize()).toBe(50)
                })

                test('the betting round ends', () => {
                    expect(table.bettingRoundInProgress()).toBeFalsy()
                })
            })
        })

        // Checking to see if the automatic action gets cleared.
        describe('a table where a player\'s automatic action has been taken', () => {
            beforeEach(() => {
                table.sitDown(1, 2000)
                table.sitDown(2, 2000)
                table.sitDown(3, 2000)
                table.startHand()
                table.setAutomaticAction(2, AutomaticAction.CALL)
                table.actionTaken(Action.CALL) // player 1 calls
            })

            test('precondition', () => {
                expect(table.playerToAct()).toBe(3)
            })

            describe('action gets back to him/her', () => {
                beforeEach(() => {
                    table.actionTaken(Action.RAISE, 200)
                    table.actionTaken(Action.CALL)
                })

                test('he/she is the player to act', () => {
                    expect(table.bettingRoundInProgress()).toBeTruthy()
                    expect(table.playerToAct()).toBe(2)
                })
            })
        })

        describe('a table where a player\'s automatic action is set to check_fold', () => {
            beforeEach(() => {
                table.sitDown(1, 2000)
                table.sitDown(2, 2000)
                table.sitDown(3, 2000)
                table.startHand()
                table.setAutomaticAction(3, AutomaticAction.CHECK_FOLD)
            })

            describe('some other player raises', () => {
                beforeEach(() => {
                    table.actionTaken(Action.RAISE, 200)
                })

                test('his automatic action falls back to fold', () => {
                    expect(table.automaticActions()[3]).toBe(AutomaticAction.FOLD)
                })
            })

            describe('that doesn\'t happen', () => {
                beforeEach(() => {
                    table.actionTaken(Action.CALL)
                })

                test('his/her automatic action remains the same', () => {
                    expect(table.automaticActions()[3]).toBe(AutomaticAction.CHECK_FOLD)
                })
            })
        })

        describe('a table where a player\'s automatic action is set to check', () => {
            beforeEach(() => {
                table.sitDown(1, 2000)
                table.sitDown(2, 2000)
                table.sitDown(3, 2000)
                table.startHand()
                table.setAutomaticAction(3, AutomaticAction.CHECK)
            })

            describe('some other player raises', () => {
                beforeEach(() => {
                    table.actionTaken(Action.RAISE, 200)
                })

                test('his/her automatic action gets removed', () => {
                    expect(table.automaticActions()[3]).toBeNull()
                })
            })

            describe('that doesn\'t happen', () => {
                beforeEach(() => {
                    table.actionTaken(Action.CALL)
                })

                test('his/her automatic action remains the same', () => {
                    expect(table.automaticActions()[3]).toBe(AutomaticAction.CHECK)
                })
            })
        })

        describe('a table where a player\'s automatic action is set to call_any', () => {
            beforeEach(() => {
                table.sitDown(1, 2000)
                table.sitDown(2, 2000)
                table.sitDown(3, 2000)
                table.startHand()
                table.setAutomaticAction(3, AutomaticAction.CALL_ANY)
            })

            describe('some other player goes all-in', () => {
                beforeEach(() => {
                    table.actionTaken(Action.RAISE, 2000)
                })

                // All doubt has been cleared, it's not "call any", it's "call this exact amount".
                test('his automatic action falls back to call', () => {
                    expect(table.automaticActions()[3]).toBe(AutomaticAction.CALL)
                })
            })

            describe('that doesn\'t happen', () => {
                beforeEach(() => {
                    table.actionTaken(Action.CALL)
                })

                test('his/her automatic action remains the same', () => {
                    expect(table.automaticActions()[3]).toBe(AutomaticAction.CALL_ANY)
                })
            })
        })

        describe('a table where a hand has just begun', () => {
            beforeEach(() => {
                table.sitDown(1, 2000)
                table.sitDown(2, 2000)
                table.sitDown(3, 2000)
                table.startHand()
            })

            describe('a player sets his automatic action to fold and it gets triggered', () => {
                beforeEach(() => {
                    table.setAutomaticAction(2, AutomaticAction.FOLD)
                    table.actionTaken(Action.CALL)
                })

                test('he/she folded', () => {
                    expect(table.handPlayers().filter(player => player !== null).length).toBe(2)
                })
            })

            describe('a player sets his automatic action to check_fold and it gets triggered', () => {
                test('precondition', () => {
                    expect(table.seats()[3]?.betSize()).toBe(50)
                })

                describe('actions setup', () => {
                    beforeEach(() => {
                        table.setAutomaticAction(3, AutomaticAction.CHECK_FOLD)
                        table.actionTaken(Action.CALL)
                        table.actionTaken(Action.CALL)
                    })

                    test('he/she checked', () => {
                        expect(table.bettingRoundInProgress()).toBeFalsy()
                        expect(table.seats()[3]?.betSize()).toBe(50)
                    })
                })
            })

            describe('a player sets his automatic action to check and it gets triggered', () => {
                test('precondition', () => {
                    expect(table.seats()[3]?.betSize()).toBe(50)
                })

                describe('actions setup', () => {
                    beforeEach(() => {
                        table.setAutomaticAction(3, AutomaticAction.CHECK)
                        table.actionTaken(Action.CALL)
                        table.actionTaken(Action.CALL)
                    })

                    test('he/she checked', () => {
                        expect(table.bettingRoundInProgress()).toBeFalsy()
                        expect(table.seats()[3]?.betSize()).toBe(50)
                    })
                })
            })

            describe('a player sets his automatic action to call and it gets triggered', () => {
                test('precondition', () => {
                    expect(table.seats()[2]?.betSize()).toBe(25)
                })

                describe('actions setup', () => {
                    beforeEach(() => {
                        table.setAutomaticAction(2, AutomaticAction.CALL)
                        table.actionTaken(Action.CALL)
                    })

                    test('he/she called', () => {
                        expect(table.playerToAct()).toBe(3)
                        expect(table.seats()[2]?.betSize()).toBe(50)
                    })
                })
            })

            describe('a player sets his automatic action to call_any and it gets triggered', () => {
                test('precondition', () => {
                    expect(table.seats()[2]?.betSize()).toBe(25)
                })

                describe('actions setup', () => {
                    beforeEach(() => {
                        table.setAutomaticAction(2, AutomaticAction.CALL_ANY)
                        table.actionTaken(Action.CALL)
                    })

                    test('he/she called', () => {
                        expect(table.playerToAct()).toBe(3)
                        expect(table.seats()[2]?.betSize()).toBe(50)
                    })
                })
            })

            describe('a player sets his automatic action to all_in and it gets triggered', () => {
                test('precondition', () => {
                    expect(table.playerToAct()).toBe(1)
                    expect(table.seats()[2]?.betSize()).toBe(25)
                })
                describe('actions setup', () => {
                    beforeEach(() => {
                        table.setAutomaticAction(2, AutomaticAction.ALL_IN)
                        table.actionTaken(Action.CALL)
                    })

                    test('he/she called (any)', () => {
                        expect(table.playerToAct()).toBe(3)
                        expect(table.seats()[2]?.betSize()).toBe(2000)
                    })
                })
            })
        })
    })

    test('When second to last player stands up, the hand ends', () => {
        table.sitDown(0, 1000)
        table.sitDown(1, 1000)
        table.sitDown(2, 1000)
        table.startHand()

        expect(table.playerToAct()).toBe(0)

        expect(table.seats()[0]?.betSize()).toBe(0)
        expect(table.seats()[1]?.betSize()).toBe(25)
        expect(table.seats()[2]?.betSize()).toBe(50)
        expect(table.button()).toBe(0)

        table.standUp(1)
        table.standUp(2)
        table.sitDown(1, 1000)
        table.sitDown(2, 2000)

        expect(table.bettingRoundInProgress()).toBeFalsy()
        table.endBettingRound()

        expect(table.seats()[0]?.stack()).toBe(950)

        table.showdown()
        expect(table.handInProgress()).toBeFalsy()

        expect(table.seats()[0]?.stack()).toBe(1075)

        table.startHand()
        expect(table.button()).toBe(1)
        table.standUp(2)
        table.standUp(0)
        expect(table.bettingRoundInProgress()).toBeFalsy()
        expect(table.handInProgress()).toBeTruthy()
        table.endBettingRound()
        expect(table.handInProgress()).toBeTruthy()
        table.showdown()
        expect(table.handInProgress()).toBeFalsy()
    })

    test('testing the special case', () => {
        table.sitDown(0, 1000)
        table.sitDown(1, 1000)
        table.sitDown(2, 1000)
        table.standUp(2)
        table.sitDown(2, 1000)
        table.startHand()
        table.setAutomaticAction(1, AutomaticAction.CALL_ANY)
        table.setAutomaticAction(2, AutomaticAction.CALL_ANY)
        table.actionTaken(Action.CALL)
        expect(table.bettingRoundInProgress()).toBeFalsy()
    })

    test('Community cards get reset when a new hand begins', () => {
        table.sitDown(0, 1000)
        table.sitDown(1, 1000)
        table.startHand()
        table.actionTaken(Action.CALL)
        table.actionTaken(Action.CHECK)
        table.endBettingRound()
        table.actionTaken(Action.FOLD)
        table.endBettingRound()
        expect(table.bettingRoundsCompleted()).toBeTruthy()
        table.showdown()
        table.startHand()
        expect(table.communityCards().cards().length).toBe(0)
    })

    test('Setting the button manually works on the first, as well as the subsequent hands', () => {
        table.sitDown(0, 1000)
        table.sitDown(3, 1000)
        table.sitDown(5, 1000)
        table.sitDown(8, 1000)

        // First hand
        table.startHand(8)
        expect(table.button()).toBe(8)
        table.actionTaken(Action.FOLD)
        table.actionTaken(Action.FOLD)
        table.actionTaken(Action.FOLD)
        table.endBettingRound()
        table.showdown()

        // Second hand
        table.startHand(5)
        expect(table.button()).toBe(5)
    })

    test('Buttons wraps around correctly when moved from the last position', () => {
        table.sitDown(0, 1000)
        table.sitDown(3, 1000)
        table.sitDown(5, 1000)
        table.sitDown(8, 1000)

        // First hand
        table.startHand(8)
        expect(table.button()).toBe(8)
        table.actionTaken(Action.FOLD)
        table.actionTaken(Action.FOLD)
        table.actionTaken(Action.FOLD)
        table.endBettingRound()
        table.showdown()

        // Second hand
        table.startHand()
        expect(table.button()).toBe(0)
    })

    test('No crash when the player to act stands up with one player remaining', () => {
        // This was caused by act_passively() being called in the case
        // of player_to_act standing up. Since the action is taken directly,
        // the hand ends naturally by itself and no further actions can be taken.
        table.sitDown(1, 1000)
        table.sitDown(8, 1000)
        table.startHand()
        expect(() => {
            table.standUp(1)
        }).not.toThrow()
    })

    describe('Betting round ends when only a single active player remains', () => {
        test('Correct behavior after action_taken', () => {
            table.sitDown(1, 1000)
            table.sitDown(5, 1000)
            table.sitDown(8, 1000)
            table.startHand()
            expect(table.playerToAct()).toBe(1)
            table.standUp(8)
            table.actionTaken(Action.FOLD)
            expect(table.bettingRoundInProgress()).toBeFalsy()
        })

        test('Correct behavior after stand_up', () => {
            table.sitDown(1, 1000)
            table.sitDown(5, 1000)
            table.sitDown(8, 1000)
            table.startHand()
            expect(table.playerToAct()).toBe(1)
            table.actionTaken(Action.FOLD)
            table.standUp(8)
            expect(table.bettingRoundInProgress()).toBeFalsy()
        })

        test('Heads-up preflop first-to-act all-in does not cause the other player to automatically act passively', () => {
            table.sitDown(0, 1000)
            table.sitDown(1, 1000)
            table.startHand()
            table.actionTaken(Action.RAISE, 1000)
            table.actionTaken(Action.FOLD)
            expect(table.bettingRoundInProgress()).toBeFalsy()
        })

        test('(addendum) Players who stood up or folded do not count as active', () => {
            table.sitDown(0, 1000)
            table.sitDown(1, 1000)
            table.sitDown(2, 1000)
            table.sitDown(3, 1000)
            table.startHand()
            table.standUp(3)
            table.standUp(2)
            table.actionTaken(Action.FOLD)
            expect(table.bettingRoundInProgress()).toBeFalsy()
        })
    })

    describe('Manual showdown', () => {

        let initialStack0: number
        let initialStack1: number
        let initialStack2: number

        beforeEach(() => {
            table.sitDown(0, 1000)
            table.sitDown(1, 1000)
            table.sitDown(2, 1000)

            // Capture initial stacks before any betting occurs
            initialStack0 = table.seats()[0]!.stack()
            initialStack1 = table.seats()[1]!.stack()
            initialStack2 = table.seats()[2]!.stack()

            table.startHand()
        })

        

        describe('all players reach showdown', () => {
            beforeEach(() => {
                // Complete all betting rounds to reach showdown state
                table.actionTaken(Action.CALL) // Player 0 calls
                table.actionTaken(Action.CALL) // Player 1 calls  
                table.actionTaken(Action.CHECK) // Player 2 checks
                table.endBettingRound() // End preflop
                
                table.actionTaken(Action.CHECK) // Player 1 checks
                table.actionTaken(Action.CHECK) // Player 2 checks
                table.actionTaken(Action.CHECK) // Player 0 checks
                table.endBettingRound() // End flop
                
                table.actionTaken(Action.CHECK) // Player 1 checks
                table.actionTaken(Action.CHECK) // Player 2 checks
                table.actionTaken(Action.CHECK) // Player 0 checks
                table.endBettingRound() // End turn
                
                table.actionTaken(Action.CHECK) // Player 1 checks
                table.actionTaken(Action.CHECK) // Player 2 checks
                table.actionTaken(Action.CHECK) // Player 0 checks
                table.endBettingRound() // End river
            })

            test('should perform manual showdown k', () => {
                const communityCards = [
                    new Card(CardRank.A, CardSuit.HEARTS),
                    new Card(CardRank.K, CardSuit.HEARTS),
                    new Card(CardRank.Q, CardSuit.HEARTS),
                    new Card(CardRank.J, CardSuit.HEARTS),
                    new Card(CardRank.K, CardSuit.SPADES)
                ]

                const playerCards = new Map()
                playerCards.set(0, [new Card(CardRank.T, CardSuit.HEARTS), new Card(CardRank._8, CardSuit.HEARTS)]) // Royal flush
                playerCards.set(1, [new Card(CardRank.A, CardSuit.SPADES), new Card(CardRank.K, CardSuit.SPADES)]) // Full house
                playerCards.set(2, [new Card(CardRank._2, CardSuit.CLUBS), new Card(CardRank._3, CardSuit.CLUBS)]) // High card

                table.manualShowdown(communityCards, playerCards)

                expect(table.handInProgress()).toBeFalsy()
                // Player 0 should win the entire pot
                expect(table.seats()[0]!.stack()).toBeGreaterThan(initialStack0)
                expect(table.seats()[1]!.stack()).toBeLessThan(initialStack1)
                expect(table.seats()[2]!.stack()).toBeLessThan(initialStack2)

                const winners = table.winners()
                expect(winners).toHaveLength(1) // One pot
                expect(winners[0]).toHaveLength(1) // One winner in that pot
                expect(winners[0][0][0]).toBe(0) // Seat index 0 won
                expect(winners[0][0][1].ranking()).toBe(HandRanking.ROYAL_FLUSH)
            })

            test('should handle split pot in manual showdown', () => {
                const communityCards = [
                    new Card(CardRank.A, CardSuit.CLUBS),
                    new Card(CardRank._7, CardSuit.DIAMONDS),
                    new Card(CardRank.T, CardSuit.SPADES),
                    new Card(CardRank._5, CardSuit.HEARTS),
                    new Card(CardRank._3, CardSuit.CLUBS)
                ]

                const playerCards = new Map()
                playerCards.set(0, [new Card(CardRank.A, CardSuit.SPADES), new Card(CardRank.K, CardSuit.CLUBS)]) // Royal flush (tie)
                playerCards.set(1, [new Card(CardRank.A, CardSuit.HEARTS), new Card(CardRank.K, CardSuit.DIAMONDS)]) // Royal flush (tie)
                playerCards.set(2, [new Card(CardRank._2, CardSuit.CLUBS), new Card(CardRank._6, CardSuit.CLUBS)]) // High card

                table.manualShowdown(communityCards, playerCards)

                expect(table.handInProgress()).toBeFalsy()
                // Both players should have equal stacks (split pot)
                expect(table.seats()[0]!.stack()).toBe(table.seats()[1]!.stack())
            })

            test('should throw error when hand is not in progress', () => {
                // End the hand first
                table.showdown()

                const communityCards = [new Card(CardRank.A, CardSuit.HEARTS)]
                const playerCards = new Map()

                expect(() => table.manualShowdown(communityCards, playerCards)).toThrow('Hand must be in progress')
            })

            test('players without hole cards should automatically lose', () => {
                const communityCards = [
                    new Card(CardRank.A, CardSuit.HEARTS),
                    new Card(CardRank.K, CardSuit.HEARTS),
                    new Card(CardRank.Q, CardSuit.HEARTS),
                    new Card(CardRank.J, CardSuit.HEARTS),
                    new Card(CardRank.K, CardSuit.SPADES)
                ]

                // Only provide hole cards for player 0, not player 1
                const playerCards = new Map()
                playerCards.set(0, [new Card(CardRank.A, CardSuit.SPADES), new Card(CardRank.K, CardSuit.CLUBS)])
                // Players 1 and 2 get no hole cards

                table.manualShowdown(communityCards, playerCards)

                // Player 0 should win the entire pot, players 1 and 2 should lose
                expect(table.seats()[0]!.stack()).toBeGreaterThan(initialStack0)
                expect(table.seats()[1]!.stack()).toBeLessThan(initialStack1)
                expect(table.seats()[2]!.stack()).toBeLessThan(initialStack2)
            })

            test('should allow calling winners() after manual showdown', () => {
                const communityCards = [
                    new Card(CardRank.A, CardSuit.SPADES),
                    new Card(CardRank.K, CardSuit.SPADES),
                    new Card(CardRank.Q, CardSuit.SPADES),
                    new Card(CardRank.J, CardSuit.SPADES),
                    new Card(CardRank._9, CardSuit.CLUBS)
                ]

                const playerCards = new Map()
                playerCards.set(0, [new Card(CardRank.T, CardSuit.HEARTS), new Card(CardRank._8, CardSuit.HEARTS)]) // Straight flush
                // Player 1 is not included (folded/no cards)
                playerCards.set(2, [new Card(CardRank._2, CardSuit.CLUBS), new Card(CardRank._3, CardSuit.CLUBS)]) // High card

                // Perform manual showdown
                table.manualShowdown(communityCards, playerCards)

                // Verify hand is no longer in progress
                expect(table.handInProgress()).toBeFalsy()

                // Verify winners() can be called successfully
                expect(() => table.winners()).not.toThrow()

                // Verify winners() returns expected structure
                const winners = table.winners()
                expect(winners).toBeDefined()
                expect(Array.isArray(winners)).toBeTruthy()
                expect(winners.length).toBeGreaterThan(0)

                // Verify the winner information is accessible
                const firstPotWinners = winners[0]
                expect(Array.isArray(firstPotWinners)).toBeTruthy()
                expect(firstPotWinners.length).toBeGreaterThan(0)

                // Each winner should have [seatIndex, hand, holeCards] structure
                const winner = firstPotWinners[0]
                expect(winner).toHaveLength(4)
                expect(typeof winner[0]).toBe('number') // seat index
                expect(winner[1]).toBeDefined() // hand object
                expect(winner[2]).toBeDefined() // hole cards
            })
        })
    })

    describe('betting round state functions', () => {
        let table: Table

        beforeEach(() => {
            table = new Table({
                blinds: {
                    small: 25,
                    big: 50
                }
            }, 9)
            table.sitDown(0, 1000)
            table.sitDown(1, 1000)
            table.sitDown(2, 1000)
        })

        describe('before hand starts', () => {
            test('should throw error when checking betting round state without hand in progress', () => {
                expect(() => table.isAtStartOfBettingRound()).toThrow('Hand must be in progress')
                expect(() => table.isInMiddleOfBettingRound()).toThrow('Hand must be in progress')
            })
        })

        describe('during hand', () => {
            beforeEach(() => {
                table.startHand()
            })

            test('should be at start of betting round initially', () => {
                expect(table.handInProgress()).toBe(true)
                expect(table.bettingRoundInProgress()).toBe(true)
                expect(table.isAtStartOfBettingRound()).toBe(true)
                expect(table.isInMiddleOfBettingRound()).toBe(false)
            })

            test('should be in middle of betting round after first action', () => {
                // First player to act takes action
                table.actionTaken(Action.CALL)
                
                expect(table.bettingRoundInProgress()).toBe(true)
                expect(table.isAtStartOfBettingRound()).toBe(false)
                expect(table.isInMiddleOfBettingRound()).toBe(true)
            })

            test('should transition through states correctly during betting', () => {
                // Start state
                expect(table.isAtStartOfBettingRound()).toBe(true)
                expect(table.isInMiddleOfBettingRound()).toBe(false)

                // First action - enter middle state
                table.actionTaken(Action.CALL) // Player 0 calls
                expect(table.isAtStartOfBettingRound()).toBe(false)
                expect(table.isInMiddleOfBettingRound()).toBe(true)

                // More actions - stay in middle state
                table.actionTaken(Action.RAISE, 100) // Player 1 raises
                expect(table.isAtStartOfBettingRound()).toBe(false)
                expect(table.isInMiddleOfBettingRound()).toBe(true)

                table.actionTaken(Action.CALL) // Player 2 calls
                expect(table.isAtStartOfBettingRound()).toBe(false)
                expect(table.isInMiddleOfBettingRound()).toBe(true)

                table.actionTaken(Action.CALL) // Player 0 calls the raise
                expect(table.isAtStartOfBettingRound()).toBe(false)
                expect(table.isInMiddleOfBettingRound()).toBe(false) // Round ended
                expect(table.bettingRoundInProgress()).toBe(false)
            })

            test('should handle folding players correctly', () => {
                // Start state
                expect(table.isAtStartOfBettingRound()).toBe(true)
                
                // Players fold one by one
                table.actionTaken(Action.FOLD) // Player 0 folds
                expect(table.isInMiddleOfBettingRound()).toBe(true)
                
                table.actionTaken(Action.FOLD) // Player 1 folds
                // Now only player 2 remains, round should end
                expect(table.bettingRoundInProgress()).toBe(false)
                expect(table.isAtStartOfBettingRound()).toBe(false)
                expect(table.isInMiddleOfBettingRound()).toBe(false)
            })

            test('should handle multiple betting rounds correctly', () => {
                // Complete first betting round (preflop)
                table.actionTaken(Action.CALL) // Player 0 calls
                table.actionTaken(Action.CALL) // Player 1 calls  
                table.actionTaken(Action.CHECK) // Player 2 checks
                table.endBettingRound()

                // New betting round (flop) should start fresh
                expect(table.bettingRoundInProgress()).toBe(true)
                expect(table.isAtStartOfBettingRound()).toBe(true)
                expect(table.isInMiddleOfBettingRound()).toBe(false)
                expect(table.roundOfBetting()).toBe(RoundOfBetting.FLOP)

                // First action in flop
                table.actionTaken(Action.CHECK) // First player checks
                expect(table.isAtStartOfBettingRound()).toBe(false)
                expect(table.isInMiddleOfBettingRound()).toBe(true)

                // Complete flop betting
                table.actionTaken(Action.BET, 50) // Second player bets
                table.actionTaken(Action.CALL) // Third player calls
                table.actionTaken(Action.CALL) // First player calls
                table.endBettingRound()

                // Turn betting round
                expect(table.isAtStartOfBettingRound()).toBe(true)
                expect(table.isInMiddleOfBettingRound()).toBe(false)
                expect(table.roundOfBetting()).toBe(RoundOfBetting.TURN)
            })

            test('should handle check-check-check scenario correctly', () => {
                // All players check
                table.actionTaken(Action.CALL) // Player 0 calls big blind
                table.actionTaken(Action.CALL) // Player 1 calls
                table.actionTaken(Action.CHECK) // Player 2 (big blind) checks
                
                // Round should end
                expect(table.bettingRoundInProgress()).toBe(false)
                expect(table.isAtStartOfBettingRound()).toBe(false)
                expect(table.isInMiddleOfBettingRound()).toBe(false)
            })
        })

        describe('integration with automatic actions', () => {
            beforeEach(() => {
                table.startHand()
            })

            test('should handle automatic actions correctly with state functions', () => {
                // Set up automatic action for a player
                table.setAutomaticAction(1, AutomaticAction.FOLD)
                
                expect(table.isAtStartOfBettingRound()).toBe(true)
                
                // First player acts, should trigger automatic fold for player 1
                table.actionTaken(Action.CALL) // Player 0 calls
                
                // After automatic actions resolve
                expect(table.isInMiddleOfBettingRound()).toBe(true)
                expect(table.playerToAct()).toBe(2) // Should be player 2's turn now
            })
        })

        describe('edge cases', () => {
            test('should handle heads-up play correctly', () => {
                // Create heads-up table
                const headsUpTable = new Table({
                    blinds: {
                        small: 25,
                        big: 50
                    }
                }, 9)
                headsUpTable.sitDown(0, 1000)
                headsUpTable.sitDown(1, 1000)
                headsUpTable.startHand()
                
                expect(headsUpTable.isAtStartOfBettingRound()).toBe(true)
                expect(headsUpTable.isInMiddleOfBettingRound()).toBe(false)
                
                // First action in heads-up
                headsUpTable.actionTaken(Action.CALL) // Small blind calls
                expect(headsUpTable.isInMiddleOfBettingRound()).toBe(true)
                
                headsUpTable.actionTaken(Action.CHECK) // Big blind checks
                expect(headsUpTable.bettingRoundInProgress()).toBe(false)
            })
        })
    })
})