'use client';
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

import { useState } from 'react';

interface Comment {
    id: string;
    author: string;
    text: string;
    timestamp: string;
    replies?: Comment[];
}

function CommentFunc({comment}: {comment:any}){
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState("");

    const isLongText = comment.text.length > 150;
    const [isExpandedLong, setIsExpandedLong] = useState(false);

    return (
        <div className="flex flex-col gap-2 my-2 text-xs">
            {/* The Comment Box */}
            <div className="bg-zinc-900 border border-zinc-800 p-3 rounded">
                <div className="flex justify-between items-center text-[10px] text-zinc-500 mb-1">
                    <span className="font-mono text-emerald-400">[{comment.author}]</span>
                    <div className="flex gap-3 item-center">
                        <span>{comment.timestamp}</span>
                        {comment.replies && comment.replies.length > 0 && (
                            <button
                            onClick={() => setIsCollapsed(!isCollapsed)} className="text-zinc=400 hover:text-white underline">
                                {isCollapsed ? `View: ${comment.replies.length}` : "Unview"}
                            </button>
                        )}
                    </div>
                </div>

                {/* Text Content with "Read More" truncation if too long */}
                <p className="text-zinc-300 leading-relaxed">
                    {isLongText && !isExpandedLong ? `${comment.text.substring(0,150)}...` : comment.text}
                </p>

                {isLongText && (
                    <button
                    onClick={() => setIsExpandedLong(!isExpandedLong)} className="text-[10px] text-blue-400 hover:underline mt-1 block">
                        {isExpandedLong ? "Show less" : "Read more"}
                    </button>
                )}

                {/* Reply button trigger */}
                <button
                onClick={() => setIsReplying(!isReplying)} className="text-[10px] text-zinc-400 hover:text-emerald-400 mt-2 block">
                    {isReplying ? "Cancel" : "[+ Reply]"}
                </button>

                {/* Inline Reply Input Box */}
                {isReplying && (
                    <div className="mt-3 pt-3 border-t border-zinc-800 flex flex-col gap-2">
                        <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={`Replying to ${comment.author}...`} className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-xs text-zinc-200 outline-none focus:border-zinc-600" rows={2}/>

                        <button
                        onClick={() => {
                            alert(`Submitting reply: "${replyText}" to comment ${comment.id}`);
                            setIsReplying(false);
                            setReplyText("");
                        }}className="bg-emerald-600 hover:bg-emerald-500 text-black font-semibold py-1 rounded text-[10px] self-end px-3 transition-colors">
                            Send Reply
                        </button>
                    </div>
                )}
            </div>

            {/* RECURSION: If not collapsed, map through child replies and indent them */}
            {!isCollapsed && comment.replies && comment.replies.length > 0 && (
                <div className="ml-4 pl-3 border-l-2 border-zinc-800 flex flex-col gap-2">
                    {comment.replies.map((reply: any) => (
                        <CommentFunc key={reply.id} comment={reply} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Home(){
    const [isOpen, setIsOpen] = useState(false);
    const [activeThreadId, setActiveThreadId] = useState<null | number>(null);

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
                            <span className="text-zinc-200 font-bold tracking-wider px-1">ACTIVE DEBATES</span>
                            <div className="flex gap-10 bg-zinc-900/60 p-1 rounded-lg border border-zinc-800">

                                <div className="relative group">
                                    <button className="text-emerald-400 hover:underline">Recent</button>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block px-2.5 py-1 bg-zinc-900 text-zinc-200 text-xs rounded shadow-md whitespace-nowrap border border-zinc-700 z-10">
                                    View newest debates now
                                    </div>
                                </div>

                                <div className="relative group">
                                     <button className="hover:text-zinc-200">Top</button>
                                     <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block px-2.5 py-1 bg-zinc-900 text-zinc-200 text-xs rounded shadow-md whitespace-nowrap border border-zinc-700 z-10">
                                     Best debates recently
                                     </div>
                                </div>
                               
                                <div className="relative group">
                                    <button className="text-zinc-400 hover:text-zinc-200">WatchList</button>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block px-2.5 py-1 bg-zinc-900 text-zinc-200 text-xs rounded shadow-md whitespace-nowrap border border-zinc-700 z-10">
                                    List your favorites
                                    </div>
                                </div>
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
                                <button className="bg-zinc-900 hover:bg-zinc-800 text-zinc-200 px-3 py-1 rounded border border-zinc-800 text-xs transition-colors" 
                                onClick={() =>
                                    {
                                        setActiveThreadId(100);
                                        setIsOpen(true);
                                    }}>
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

            {isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50">
                    <div className="absolute top-6 right-6 bg-zinc-900 border border-zinc-700 p-6 rounded-lg text-white w-96 max-h-[90vh] overflow-y-auto shadow-xl">

                        <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white">✕</button>

                        {/* Header: Author & Close Button */}
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm text-zinc-400">Posted by @alex</span>
                            </div>
                            
                            {/* Title & Content */}
                            <h3 className="text-lg font-bold mb-2">Why Server-Side Rendering is Faster</h3>
                            <p className="text-sm text-zinc-300 mb-4">
                                Here is the breakdown of why moving logic to the server reduces client-side bundle size...
                                </p>
                                
                            {/* Mini Comment Section */}
                            
                            <div className="border-t border-zinc-800 pt-4 mt-4 flex flex-col gap-2">
                            <h4 className="text-[10px] font-semibold uppercase text-zinc-500 tracking-wider mb-2">Threaded Peer Reviews</h4>
                            
                            {/* Sample data hierarchy */}
                            <CommentFunc comment={{
                                id: "1",
                                author: "ANONYMOUS_DEV_99",
                                timestamp: "2 hrs ago",
                                text: "Lock-free atomic pointers look solid here. Watch out for the ABA problem on high-frequency state updates under massive write spikes, because standard CAS operations won't catch intermediate pointer recycling without version tags.",
                                replies: [
                                    {
                                        id: "1-1",
                                        author: "ANONYMOUS_ARCHITECT_04",
                                        timestamp: "1 hr ago",
                                        text: "Good catch. Version counting or hazard pointers can completely solve the ABA vector.",
                                        replies: [
                                            {
                                                id: "1-1-1",
                                                author: "ANONYMOUS_DEV_99",
                                                timestamp: "30 mins ago",
                                                text: "Hazard pointers add too much overhead. Let's stick to epoch-based reclamation."
                                            }
                                        ]
                                    }
                                ]
                            }} />
                        </div>
                    </div>
                </div>
                )}
        </main>
    )
}

