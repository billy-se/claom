{/*
    <main className="min-h-screen bg-black text-white font-mono p-8 flex flex-col justify-center items-center relative">
            <div className="w-[600px] h-[400px] w-full max-w-4xl bg-zinc-950 border border-zinc-800 py-60 px-20 rounded-none">
                <div className="absolute left-270 top-43 h-100 w-[1px] bg-zinc-800"></div>
                <div className="absolute left-265 top-55 h-100 w-[1px] bg-zinc-700 h-[340px]"></div>

                <div className="w-22 h-22 bg-black border border-zinc-700 rounded-full flex items-center justify-center absolute right-125 bottom-50"></div>
                <div className="w-22 h-22 bg-black border border-zinc-700 rounded-full flex items-center justify-center absolute right-125 top-80"></div>
                <div className="w-22 h-22 bg-black border border-zinc-700 rounded-full flex items-center justify-center absolute right-125 top-50"></div>

                <div className="w-24 h-24 bg-black border border-zinc-700 rounded-none flex items-center justify-center absolute right-85 top-45"></div>
                <div className="w-24 h-24 bg-black border border-zinc-700 rounded-none flex items-center justify-center absolute right-85 top-85"></div>

                <div className="w-10 h-10 border-t-2 border-r-2 border-zinc-400 rotate-315 absolute right-92.5 bottom-40"></div>
                
                <div className="w-10 h-10 bg-amber-200 border border-zinc-700 rounded-none flex items-center justify-center relative left-120 bottom-50">
                    <span className="font-serif italic text-2xl text-black">p</span></div>

                <div className="absolute left-30 top-10 h-85 w-[1px] bg-zinc-800 top-60 left-225" />
                
            </div>
    </main>
    */}

export default function Home(){
    return (
        <main className="min-h-screen bg-black text-zinc-100 font-mono p-6 md:p-12 flex justify-center">
            
            {/* Main Shell */}
            <div className="w-full max-w-6xl flex flex-col gap-6">
                
                {/* Top Nav / Identity Shield Bar */}
                <header className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 md:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                        <div>
                            <h1 className="text-sm font-semibold tracking-widest uppercase text-zinc-200">
                                [ SESSION_ALIAS: USER_HASH_8842 ]
                            </h1>
                            <p className="text-[10px] text-zinc-500">Zero-Bias Identity Protection Active</p>
                        </div>
                    </div>
                    
                    {/* Merit & Reputation Stats (No Follower Counts) */}
                    <div className="flex items-center gap-6 text-xs border-t sm:border-t-0 border-zinc-800 pt-3 sm:pt-0 w-full sm:w-auto justify-between sm:justify-end">
                        <div>
                            <span className="text-zinc-500 block text-[10px]">ACCURACY TIER</span>
                            <span className="text-emerald-400 font-bold">Level 4 (94.2%)</span>
                        </div>
                        <div>
                            <span className="text-zinc-500 block text-[10px]">REVIEW WEIGHT</span>
                            <span className="text-blue-400 font-bold">1.4x</span>
                        </div>
                    </div>
                </header>

                {/* Main Content Grid: Left (Feed), Right (Actions/Stats) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Left 2 Columns: Blind Peer-Review Feed */}
                    <div className="lg:col-span-2 flex flex-col gap-4">
                        
                        {/* Feed Controls / Filters */}
                        <div className="flex justify-between items-center bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-400">
                            <span className="text-zinc-200 font-bold tracking-wider">ACTIVE DEBATES & PRS</span>
                            <div className="flex gap-3">
                                <button className="text-emerald-400 hover:underline">Top Logic</button>
                                <button className="hover:text-zinc-200">Needs Review</button>
                                <button className="hover:text-zinc-200">Recent</button>
                            </div>
                        </div>

                        {/* Thread Card 1 */}
                        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-5 flex flex-col gap-4 hover:border-zinc-700 transition-colors">
                            <div className="flex justify-between items-center text-[10px] text-zinc-500">
                                <span>AUTHOR: [ ANONYMOUS_DEV_49 ]</span>
                                <span className="bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-zinc-300">Pull Request #104</span>
                            </div>
                            <h2 className="text-sm font-semibold text-zinc-100">
                                Optimizing State Synchronization in Distributed Rust Microservices without Locks
                            </h2>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                                Proposing an optimistic concurrency control pattern that eliminates lock contention under heavy write loads. Looking for edge-case peer reviews on memory safety.
                            </p>
                            <div className="flex justify-between items-center pt-3 border-t border-zinc-900 text-xs">
                                <span className="text-emerald-400">Logic Score: +48</span>
                                <button className="bg-zinc-900 hover:bg-zinc-800 text-zinc-200 px-3 py-1 rounded border border-zinc-800 text-xs transition-colors">
                                    Review Argument
                                </button>
                            </div>
                        </div>

                        {/* Thread Card 2 */}
                        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-5 flex flex-col gap-4 hover:border-zinc-700 transition-colors">
                            <div className="flex justify-between items-center text-[10px] text-zinc-500">
                                <span>AUTHOR: [ ANONYMOUS_ARCHITECT_12 ]</span>
                                <span className="bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-zinc-300">Architecture Debate</span>
                            </div>
                            <h2 className="text-sm font-semibold text-zinc-100">
                                Why Time-Decay Algorithms Outperform Pure Upvoting in Meritocratic Systems
                            </h2>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                                Analyzing the mathematical flaws of static upvote weights and how a half-life decay formula ensures early bias doesn't dominate discussion boards.
                            </p>
                            <div className="flex justify-between items-center pt-3 border-t border-zinc-900 text-xs">
                                <span className="text-emerald-400">Logic Score: +32</span>
                                <button className="bg-zinc-900 hover:bg-zinc-800 text-zinc-200 px-3 py-1 rounded border border-zinc-800 text-xs transition-colors">
                                    Review Argument
                                </button>
                            </div>
                        </div>

                    </div>

                    {/* Right Column: User Actions & System Info */}
                    <div className="flex flex-col gap-6">
                        
                        {/* Quick Action Box */}
                        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-5 flex flex-col gap-4">
                            <h2 className="text-xs font-bold tracking-wider uppercase text-zinc-200">
                                [ SUBMIT FOR REVIEW ]
                            </h2>
                            <p className="text-xs text-zinc-500">
                                Submit a code proposal, paper, or architectural argument to the blind review pool.
                            </p>
                            <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-semibold py-2 rounded text-xs transition-colors">
                                + NEW BLIND SUBMISSION
                            </button>
                        </div>

                        {/* Platform Rules / Integrity Card */}
                        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-5 flex flex-col gap-3">
                            <h2 className="text-xs font-bold tracking-wider uppercase text-zinc-200">
                                [ MERIT METRICS ]
                            </h2>
                            <div className="flex flex-col gap-2 text-xs text-zinc-400">
                                <div className="flex justify-between">
                                    <span>Peer Reviews Given:</span>
                                    <span className="text-zinc-200">14</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Logic Consensus Rate:</span>
                                    <span className="text-emerald-400">89%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Anonymity Integrity:</span>
                                    <span className="text-blue-400">Secure</span>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>

            </div>

        </main>
    )
}

