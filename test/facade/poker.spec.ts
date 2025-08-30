import Poker from '../../src/facade/poker'

describe('Poker facade', () => {
    let poker: Poker
    beforeEach(() => {
        poker = new Poker({ smallBlind: 50, bigBlind: 100 })
        poker.sitDown(0, 2000)
        poker.sitDown(1, 2000)
        poker.sitDown(2, 2000)

    })

    test('set forced bets', () => {
        poker.setForcedBets({ smallBlind: 100, bigBlind: 200 })
        expect(poker.forcedBets()).toStrictEqual({
            ante: 0,
            smallBlind: 100,
            bigBlind: 200,
        })
    })

    test('number of seats', () => {
        expect(poker.numSeats()).toBe(9)
    })

    test('stand up', () => {
        expect(poker.seats()).toEqual([
            { totalChips: 2000, stack: 2000, betSize: 0 },
            { totalChips: 2000, stack: 2000, betSize: 0 },
            { totalChips: 2000, stack: 2000, betSize: 0 },
            null,
            null,
            null,
            null,
            null,
            null,
        ])

        poker.standUp(2)

        expect(poker.seats()).toEqual([
            { totalChips: 2000, stack: 2000, betSize: 0 },
            { totalChips: 2000, stack: 2000, betSize: 0 },
            null,
            null,
            null,
            null,
            null,
            null,
            null,
        ])
    })

    describe('hand in progress', () => {
        beforeEach(() => {
            poker.startHand()
        })

        test('player to act', () => {
            expect(poker.playerToAct()).toBe(0)
        })

        test('button', () => {
            expect(poker.button()).toBe(0)
        })

        test('seats', () => {
            expect(poker.seats()).toEqual([
                { totalChips: 2000, stack: 2000, betSize: 0 },
                { totalChips: 2000, stack: 1950, betSize: 50 },
                { totalChips: 2000, stack: 1900, betSize: 100 },
                null,
                null,
                null,
                null,
                null,
                null,
            ])
        })

        test('hand players', () => {
            expect(poker.handPlayers()).toEqual([
                { totalChips: 2000, stack: 2000, betSize: 0 },
                { totalChips: 2000, stack: 1950, betSize: 50 },
                { totalChips: 2000, stack: 1900, betSize: 100 },
                null,
                null,
                null,
                null,
                null,
                null,
            ])
        })

        test('number of active players', () => {
            expect(poker.numActivePlayers()).toBe(3)
        })

        test('forced bets', () => {
            expect(poker.forcedBets()).toStrictEqual({
                ante: 0,
                smallBlind: 50,
                bigBlind: 100,
            })
        })

        test('hand in progress', () => {
            expect(poker.isHandInProgress()).toBeTruthy()
        })

        test('betting round in progress', () => {
            expect(poker.isBettingRoundInProgress()).toBeTruthy()
        })

        test('betting rounds completed', () => {
            expect(poker.areBettingRoundsCompleted()).toBeFalsy()
        })

        test('round of betting', () => {
            expect(poker.roundOfBetting()).toBe('preflop')
        })

        test('legal actions', () => {
            expect(poker.legalActions()).toEqual({
                actions: ['fold', 'call', 'raise'],
                chipRange: { max: 2000, min: 200 },
            })
        })

        test('folded bet is not excluded from table players', () => {
            poker.actionTaken('call')
            poker.actionTaken('fold')

            expect(poker.seats()).toEqual([
                { totalChips: 2000, stack: 1900, betSize: 100 },
                { totalChips: 2000, stack: 1950, betSize: 50 },
                { totalChips: 2000, stack: 1900, betSize: 100 },
                null,
                null,
                null,
                null,
                null,
                null,
            ])

            expect(poker.handPlayers()).toEqual([
                { totalChips: 2000, stack: 1900, betSize: 100 },
                null,
                { totalChips: 2000, stack: 1900, betSize: 100 },
                null,
                null,
                null,
                null,
                null,
                null,
            ])
        })

        test('bet is cleared from folding table player after ending betting round', () => {
            poker.actionTaken('call')
            poker.actionTaken('fold')
            poker.actionTaken('check')
            poker.endBettingRound()

            expect(poker.seats()[1]?.betSize).toEqual(0)
        })

        describe('After first betting round', () => {
            beforeEach(() => {
                poker.actionTaken('call')
                poker.actionTaken('call')
                poker.actionTaken('check')
                poker.endBettingRound()
            })

            test('pots', () => {
                expect(poker.pots()).toStrictEqual([
                    { size: 300, eligiblePlayers: [0, 1, 2] },
                ])
            })

            test('community cards', () => {
                expect(poker.communityCards().length).toBe(3)
                for (const card of poker.communityCards()) {
                    expect(card.suit).toMatch(/clubs|diamonds|hearts|spades/)
                    expect(card.rank).toMatch(/2|3|4|5|6|7|8|9|T|J|Q|K|A/)
                }
            })

            test('hole cards', () => {
                expect(poker.holeCards().length).toBe(9)
                for (const cards of poker.holeCards()) {
                    if (cards !== null) {
                        for (const card of cards) {
                            expect(card.suit).toMatch(/clubs|diamonds|hearts|spades/)
                            expect(card.rank).toMatch(/2|3|4|5|6|7|8|9|T|J|Q|K|A/)
                        }
                    }
                }
            })

            test('can set automatic actions', () => {
                expect(poker.canSetAutomaticActions(2)).toBeTruthy()
            })

            test('legal automatic actions', () => {
                expect(poker.legalAutomaticActions(2)).toEqual([
                    'fold',
                    'check/fold',
                    'check',
                    'call any',
                    'all-in',
                ])
            })

            test('set automatic action', () => {
                poker.setAutomaticAction(2, 'call any')
                expect(poker.automaticActions()).toEqual([
                    null,
                    null,
                    'call any',
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                ])
            })

            test('reset automatic action', () => {
                poker.setAutomaticAction(2, 'call any')
                poker.setAutomaticAction(2, null)
                expect(poker.automaticActions()).toEqual([
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                ])
            })

            describe('After all betting round', () => {
                beforeEach(() => {
                    poker.actionTaken('check')
                    poker.actionTaken('check')
                    poker.actionTaken('check')
                    poker.endBettingRound()
                    poker.actionTaken('check')
                    poker.actionTaken('check')
                    poker.actionTaken('check')
                    poker.endBettingRound()
                    poker.actionTaken('check')
                    poker.actionTaken('check')
                    poker.actionTaken('check')
                    poker.endBettingRound()
                })

                test('showdown', () => {
                    expect(poker.isHandInProgress()).toBeTruthy()
                    poker.showdown()
                    expect(poker.isHandInProgress()).toBeFalsy()
                })

                describe("Starting new round", () => {
                    beforeEach(() => {
                        poker.showdown()
                    })

                    test("expect dealer button to move", () => {
                        poker.startHand()
                        expect(poker.button()).toBe(1)
                        expect(poker.playerToAct()).toBe(1)
                    })

                    test("set dealer explicitly", () => {
                        poker.startHand(2)
                        expect(poker.button()).toBe(2)
                        expect(poker.playerToAct()).toBe(2)
                    })

                    test("setting dealer explicitly to non hand player should reset dealer", () => {
                        poker.startHand(10)
                        expect(poker.button()).toBe(0)
                        expect(poker.playerToAct()).toBe(0)
                    })
                })
            })
        })
    })

    describe('betting round state functions', () => {
        let poker: Poker

        beforeEach(() => {
            poker = new Poker({ bigBlind: 50, smallBlind: 25 }, 9)
            poker.sitDown(0, 1000)
            poker.sitDown(1, 1000)
            poker.sitDown(2, 1000)
        })

        describe('before hand starts', () => {
            test('should throw error when checking betting round state without hand in progress', () => {
                expect(() => poker.isAtStartOfBettingRound()).toThrow('Hand must be in progress')
                expect(() => poker.isInMiddleOfBettingRound()).toThrow('Hand must be in progress')
            })
        })

        describe('during hand', () => {
            beforeEach(() => {
                poker.startHand()
            })

            test('should be at start of betting round initially', () => {
                expect(poker.isHandInProgress()).toBe(true)
                expect(poker.isBettingRoundInProgress()).toBe(true)
                expect(poker.isAtStartOfBettingRound()).toBe(true)
                expect(poker.isInMiddleOfBettingRound()).toBe(false)
            })

            test('should be in middle of betting round after first action', () => {
                // First player to act takes action
                poker.actionTaken('call')
                
                expect(poker.isBettingRoundInProgress()).toBe(true)
                expect(poker.isAtStartOfBettingRound()).toBe(false)
                expect(poker.isInMiddleOfBettingRound()).toBe(true)
            })

            test('should transition through states correctly during betting', () => {
                // Start state
                expect(poker.isAtStartOfBettingRound()).toBe(true)
                expect(poker.isInMiddleOfBettingRound()).toBe(false)

                // First action - enter middle state
                poker.actionTaken('call') // Player 0 calls
                expect(poker.isAtStartOfBettingRound()).toBe(false)
                expect(poker.isInMiddleOfBettingRound()).toBe(true)

                // More actions - stay in middle state
                poker.actionTaken('raise', 100) // Player 1 raises
                expect(poker.isAtStartOfBettingRound()).toBe(false)
                expect(poker.isInMiddleOfBettingRound()).toBe(true)

                poker.actionTaken('call') // Player 2 calls
                expect(poker.isAtStartOfBettingRound()).toBe(false)
                expect(poker.isInMiddleOfBettingRound()).toBe(true)

                poker.actionTaken('call') // Player 0 calls the raise
                expect(poker.isAtStartOfBettingRound()).toBe(false)
                expect(poker.isInMiddleOfBettingRound()).toBe(false) // Round ended
                expect(poker.isBettingRoundInProgress()).toBe(false)
            })

            test('should handle folding players correctly', () => {
                // Start state
                expect(poker.isAtStartOfBettingRound()).toBe(true)
                
                // Players fold one by one
                poker.actionTaken('fold') // Player 0 folds
                expect(poker.isInMiddleOfBettingRound()).toBe(true)
                
                poker.actionTaken('fold') // Player 1 folds
                // Now only player 2 remains, round should end
                expect(poker.isBettingRoundInProgress()).toBe(false)
                expect(poker.isAtStartOfBettingRound()).toBe(false)
                expect(poker.isInMiddleOfBettingRound()).toBe(false)
            })

            test('should handle multiple betting rounds correctly', () => {
                // Complete first betting round (preflop)
                poker.actionTaken('call') // Player 0 calls
                poker.actionTaken('call') // Player 1 calls  
                poker.actionTaken('check') // Player 2 checks
                poker.endBettingRound()

                // New betting round (flop) should start fresh
                expect(poker.isBettingRoundInProgress()).toBe(true)
                expect(poker.isAtStartOfBettingRound()).toBe(true)
                expect(poker.isInMiddleOfBettingRound()).toBe(false)
                expect(poker.roundOfBetting()).toBe('flop')

                // First action in flop
                poker.actionTaken('check') // First player checks
                expect(poker.isAtStartOfBettingRound()).toBe(false)
                expect(poker.isInMiddleOfBettingRound()).toBe(true)

                // Complete flop betting
                poker.actionTaken('bet', 50) // Second player bets
                poker.actionTaken('call') // Third player calls
                poker.actionTaken('call') // First player calls
                poker.endBettingRound()

                // Turn betting round
                expect(poker.isAtStartOfBettingRound()).toBe(true)
                expect(poker.isInMiddleOfBettingRound()).toBe(false)
                expect(poker.roundOfBetting()).toBe('turn')
            })

            test('should work with legal actions integration', () => {
                // At start, should have legal actions available
                expect(poker.isAtStartOfBettingRound()).toBe(true)
                const initialActions = poker.legalActions()
                expect(initialActions.actions.length).toBeGreaterThan(0)

                // After first action, should still have actions but different state
                poker.actionTaken('call')
                expect(poker.isInMiddleOfBettingRound()).toBe(true)
                const middleActions = poker.legalActions()
                expect(middleActions.actions.length).toBeGreaterThan(0)
            })
        })

        describe('edge cases', () => {
            test('should handle heads-up play correctly', () => {
                // Create heads-up game
                const headsUpPoker = new Poker({ bigBlind: 50, smallBlind: 25 }, 9)
                headsUpPoker.sitDown(0, 1000)
                headsUpPoker.sitDown(1, 1000)
                headsUpPoker.startHand()
                
                expect(headsUpPoker.isAtStartOfBettingRound()).toBe(true)
                expect(headsUpPoker.isInMiddleOfBettingRound()).toBe(false)
                
                // First action in heads-up
                headsUpPoker.actionTaken('call') // Small blind calls
                expect(headsUpPoker.isInMiddleOfBettingRound()).toBe(true)
                
                headsUpPoker.actionTaken('check') // Big blind checks
                expect(headsUpPoker.isBettingRoundInProgress()).toBe(false)
            })

            test('should handle state checks across different game phases', () => {
                // Preflop
                poker.startHand()
                expect(poker.isAtStartOfBettingRound()).toBe(true)
                expect(poker.roundOfBetting()).toBe('preflop')

                // Complete preflop
                poker.actionTaken('call')
                poker.actionTaken('call')
                poker.actionTaken('check')
                poker.endBettingRound()

                // Flop
                expect(poker.isAtStartOfBettingRound()).toBe(true)
                expect(poker.roundOfBetting()).toBe('flop')

                // Complete flop
                poker.actionTaken('check')
                poker.actionTaken('check')
                poker.actionTaken('check')
                poker.endBettingRound()

                // Turn
                expect(poker.isAtStartOfBettingRound()).toBe(true)
                expect(poker.roundOfBetting()).toBe('turn')

                // Complete turn
                poker.actionTaken('check')
                poker.actionTaken('check')
                poker.actionTaken('check')
                poker.endBettingRound()

                // River
                expect(poker.isAtStartOfBettingRound()).toBe(true)
                expect(poker.roundOfBetting()).toBe('river')
            })
        })
    })
})