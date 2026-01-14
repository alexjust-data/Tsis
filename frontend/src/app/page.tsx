import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, TrendingUp, Calendar, BarChart3, Upload } from "lucide-react";

export default function Home() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Hero Section */}
            <div className="container mx-auto px-4 py-20">
                <div className="text-center space-y-8">
                    <div className="flex justify-center">
                        <div className="p-4 bg-blue-500/10 rounded-full">
                            <TrendingUp className="h-16 w-16 text-blue-500" />
                        </div>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400">
                        TSIS.ai
                    </h1>

                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        Professional Trading Journal for Day Traders. Track your performance,
                        analyze your trades, and improve your strategy.
                    </p>

                    <div className="flex gap-4 justify-center">
                        <Link href="/login">
                            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                                Get Started <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href="/register">
                            <Button variant="outline" size="lg">
                                Create Account
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Features */}
                <div className="mt-24 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-colors">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <BarChart3 className="h-5 w-5 text-blue-500" />
                                Performance Analytics
                            </CardTitle>
                            <CardDescription>
                                Track your metrics
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-slate-400">
                            Win rate, profit factor, P&L by ticker, timing analysis,
                            and more. All calculated automatically.
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-700 hover:border-teal-500/50 transition-colors">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <Calendar className="h-5 w-5 text-teal-500" />
                                Calendar View
                            </CardTitle>
                            <CardDescription>
                                Daily performance
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-slate-400">
                            Visual calendar showing your daily P&L, number of trades,
                            and win rate. Identify patterns in your trading.
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-colors">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <Upload className="h-5 w-5 text-purple-500" />
                                Easy Import
                            </CardTitle>
                            <CardDescription>
                                CSV & Excel support
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-slate-400">
                            Import your trades from any broker export.
                            Supports CSV and Excel files with automatic column mapping.
                        </CardContent>
                    </Card>
                </div>

                {/* Footer */}
                <div className="mt-24 text-center text-slate-500 text-sm">
                    <p>Built for traders, by traders. Start tracking your performance today.</p>
                </div>
            </div>
        </main>
    );
}
