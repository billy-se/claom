'use client';

import { useState, useEffect, useRef } from 'react';
import { Comment, Argument } from './types';
import { ReviewModal } from './reviewModal';
import { CreateArgumentModal } from './createModal';

export default function Home() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeThreadId, setActiveThreadId] = useState<null | number>(null);
    const [argumentsList, setArgumentsList] = useState<Argument[]>([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const [newTitle, setNewTitle] = useState("");
    const [newContent, setNewContent] = useState("");

    const [error, setError] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentUsername, setCurrentUsername] = useState('GUESS');

    const ws = useRef<WebSocket | null>(null);

    const mapComments = (commentsList: any[]): Comment[] => {
                if (!commentsList) return [];
                return commentsList.map((comment: any) => ({
                    id: String(comment.id),
                    author: comment.author || "ANONYMOUS",
                    content: comment.content,
                    timestamp: comment.timestamp,
                    replies: mapComments(comment.replies || comment.comments || [])
                })).reverse();
            };

    useEffect(() => {
    
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('username');

        if (token){
            setIsLoggedIn(true);
            }
        if(user){
            setCurrentUsername(user);
        }

        const loadArguments = async () => {
            try{
                const res = await fetch('http://localhost:2026/api/arguments');
                if(!res.ok){
                    throw new Error('Failed to fetch arguments');
                }

                const data = await res.json();

                const initializedData = data.map((arg: Argument) => ({
                    ...arg,
                    comments: mapComments(arg.comments || [])
                }));

                setArgumentsList(initializedData);
            }catch(err){
                console.error("Failed to fetch arguments:", err);
            };
        }
        loadArguments();

        ws.current = new WebSocket(`ws://localhost:2026/ws?token=${token}`)

        ws.current.onopen = () => {
        
        }

        ws.current.onmessage = (Event) => {
            const data = JSON.parse(Event.data);

            if (data.type === "NEW_ARGUMENT") {
                const rawPayload = data.payload || data;
                const newArg: Argument = {
                    ...rawPayload,
                    comments: mapComments(rawPayload.comments || [])
                };

                setArgumentsList(prev => {
                    if (prev.some(arg => arg.id === newArg.id)) return prev;
                    return [newArg, ...prev];
                });
            } else if (data.type === "NEW_COMMENT") {
                const newComment: Comment = {
                    id: String(data.payload.id),
                    author: data.payload.author || "ANONYMOUS",
                    content: data.payload.content,
                    timestamp: data.payload.timestamp || 
                        (data.payload.created_at ? data.payload.created_at.split('.')[0].replace('T', ' ') : "Just now"),
                    replies: []
                };

                const argumentId = String(data.payload.argument_id);
                const parentId = data.payload.parent_id;

                const addReplyRecursive = (list: Comment[]): Comment[] => {
                    return list.map(comment => {
                        if (comment.id === String(parentId)) {
                            if (comment.replies?.some(r => r.id === newComment.id)) return comment;
                            return { ...comment, replies: [newComment, ...(comment.replies || [])] };
                        }
                        if (comment.replies && comment.replies.length > 0) {
                            return { ...comment, replies: addReplyRecursive(comment.replies) };
                        }
                        return comment;
                    });
                };

                setArgumentsList(prev => prev.map(arg => {
                    if (String(arg.id) === argumentId) {
                        const currentComments = arg.comments || [];
                        if (parentId == null || parentId === undefined || parentId === "root-id") {
                            if (currentComments.some(c => c.id === newComment.id)) return arg;
                            return { ...arg, comments: [newComment, ...currentComments] };
                        }
                        return { ...arg, comments: addReplyRecursive(currentComments) };
                    }
                    return arg;
                }));
            }
        };

        return () => {
            ws.current?.close(1000, 'User session ended');
        }

    }, []);


    const activeArguments = (argumentsList || []).find((arg) => arg.id === activeThreadId) ?? null;

    
    const handleAddComment = (commentData: Comment) => {
        if(!activeThreadId) return;

        setArgumentsList(previousList => previousList.map(arg => {
            if (arg.id === activeThreadId){
                return {...arg, comments: [commentData, ...(arg.comments || [])]};
            }
            return arg;
        }))
    };

    const handleAddReply = (targetId: string, savedComment: { id: number; content: string; created_at: string }) => {
    if (!activeThreadId) return;
};

    const handleCreateSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    setError('');

    try {
        const res = await fetch('http://localhost:2026/api/arguments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title: newTitle, content: newContent }),
        });

        if (!res.ok) {
            const errText = await res.text();
            setError(errText);
            return;
        }

        const newArgument = await res.json();

        setArgumentsList(prev => {
            const formattedArg = {
                ...newArgument,
                comments: mapComments(newArgument.comments || [])
            };
            if (prev.some(arg => arg.id === formattedArg.id)) return prev;
            return [formattedArg, ...prev];
        });

        setNewTitle("");
        setNewContent("");
        setIsCreateOpen(false);

    } catch (err: any) {
        setError(err.message);
    }
};
    
    return (
        <main className="min-h-screen bg-black text-zinc-100 font-mono p-6 md:p-12 flex justify-center">
            <div className="w-full max-w-6xl flex flex-col gap-6">
                
                <header className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 md:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        
                        <div>
                            <h1 className="text-sm font-semibold tracking-widest uppercase text-zinc-200">
                                {currentUsername}
                            </h1>
                            <p className="text-[10px] text-zinc-500">Username</p>
                        </div>
                    </div>
                    
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 flex flex-col gap-4">
                        <div className="flex justify-between items-center bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-400">
                            <span className="text-zinc-200 font-bold tracking-wider px-1">ACTIVE DEBATES</span>
                            <div className="flex gap-10 bg-zinc-900/60 p-1 rounded-lg border border-zinc-800">
                                <div className="relative group">
                                    <button className="text-emerald-400 hover:underline">Recent</button>
                                </div>
                                <div className="relative group">
                                     <button className="hover:text-zinc-200">Top</button>
                                </div>
                                <div className="relative group">
                                    <button className="text-zinc-400 hover:text-zinc-200">WatchList</button>
                                </div>
                            </div>
                        </div>

                        {(argumentsList || []).map((arg) => (
                            <div key={arg.id} className="bg-zinc-950 border border-zinc-800 rounded-lg p-5 flex flex-col gap-4 hover:border-zinc-700 transition-colors">
                                <div className="flex justify-between items-center text-[10px] text-zinc-500">
                                    <span>AUTHOR: [{arg.author}]</span>
                                    <span className="bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-zinc-300">Pull Request #104</span>
                                </div>
                                <h2 className="text-sm font-semibold text-zinc-100">
                                    {arg.title}
                                </h2>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    {arg.content}
                                </p>
                                <div className="flex justify-between items-center pt-3 border-t border-zinc-900 text-xs">
                                    <span className="text-emerald-400">Logic Score: +{arg.logic_score}</span>
                                    <button className="bg-zinc-900 hover:bg-zinc-800 text-zinc-200 px-3 py-1 rounded border border-zinc-800 text-xs transition-colors" 
                                    onClick={() => {
                                        setActiveThreadId(arg.id);
                                        setIsOpen(true);
                                    }}>
                                        Review Argument
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col gap-6">
                        {isLoggedIn && (
                        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-5 flex flex-col gap-4">
                            <h2 className="text-xs font-bold tracking-wider uppercase text-zinc-200">
                                SUBMIT FOR REVIEW
                            </h2>
                            <p className="text-xs text-zinc-500">
                                Submit a code proposal, paper, or architectural argument to the blind review pool.
                            </p>
                            <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-semibold py-2 rounded text-xs transition-colors"
                            onClick={() => setIsCreateOpen(true)}>
                                Create an Argument
                            </button>
                        </div>
                        )}

                        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-5 flex flex-col gap-3">
                            <h2 className="text-xs font-bold tracking-wider uppercase text-zinc-200">
                                Stats:
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

                    <ReviewModal 
                    isOpen={isOpen} 
                    activeArguments={activeArguments} 
                    setIsOpen={setIsOpen} 
                    handleAddReply={handleAddReply}
                />

                {isLoggedIn && (
                    <>
                <CreateArgumentModal
                    isCreateOpen={isCreateOpen}
                    error={error}
                    newTitle={newTitle}
                    newContent={newContent}
                    setNewTitle={setNewTitle}
                    setNewContent={setNewContent}
                    setIsCreateOpen={setIsCreateOpen}
                    onSubmit={handleCreateSubmit}
                />
                    </>
                )}
            </div>
        </main>
    );
}