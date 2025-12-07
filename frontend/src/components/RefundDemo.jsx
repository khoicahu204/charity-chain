import React from 'react';

const RefundDemo = () => {
    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-8 mb-6 text-white">
                <h1 className="text-3xl font-bold mb-2">🔄 Refund Demo</h1>
                <p className="text-pink-100">
                    Demonstration of the refund workflow when a campaign fails to reach its goal
                </p>
            </div>

            {/* Limitation Warning */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-6 rounded-lg">
                <div className="flex items-start">
                    <svg className="h-6 w-6 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800 mb-2">⚠️ Web Demo Limitation</h3>
                        <div className="text-sm text-yellow-700 space-y-2">
                            <p>
                                Web demo <strong>không thể manipulate blockchain time</strong> qua MetaMask.
                            </p>
                            <p>
                                Campaign với deadline instant sẽ bị reject khi donate vì deadline đã qua ngay lập tức.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Python Script Solution */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-white">
                    ✅ Giải pháp: Sử dụng Python Script
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                    Để test đầy đủ refund workflow với time manipulation, vui lòng sử dụng script Python:
                </p>

                <div className="bg-slate-900 rounded-lg p-4 mb-4">
                    <code className="text-green-400 text-sm font-mono">
                        cd charity_donation<br />
                        ape run scripts/test_refund.py
                    </code>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                        Script sẽ tự động:
                    </h3>
                    <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-400">
                        <li>✅ Deploy Token và CharityDonation contracts</li>
                        <li>✅ Tạo campaign với target 1000 CHT</li>
                        <li>✅ Donate 500 CHT (không đủ target)</li>
                        <li>✅ Fast-forward thời gian 2 ngày (evm_increaseTime)</li>
                        <li>✅ Check goal → FAIL</li>
                        <li>✅ Refund tokens về cho donor</li>
                        <li>✅ Log chi tiết kết quả ra terminal</li>
                    </ul>
                </div>
            </div>

            {/* Alternative: Manual Testing */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-white">
                    🔧 Hoặc: Test thủ công trên UI
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                    Nếu muốn test trên web UI, bạn cần:
                </p>

                <ol className="space-y-3 text-slate-700 dark:text-slate-300">
                    <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                        <div>
                            <strong>Tạo campaign</strong> với duration dài (ví dụ: 7 ngày)
                        </div>
                    </li>
                    <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                        <div>
                            <strong>Donate</strong> một số tiền nhỏ hơn target
                        </div>
                    </li>
                    <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                        <div>
                            <strong>Fast-forward time</strong> bằng Hardhat console:
                            <div className="bg-slate-900 rounded p-2 mt-2 text-xs">
                                <code className="text-green-400">
                                    npx hardhat console --network localhost<br />
                                    await network.provider.send("evm_increaseTime", [86400 * 8])<br />
                                    await network.provider.send("evm_mine")
                                </code>
                            </div>
                        </div>
                    </li>
                    <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                        <div>
                            Quay lại web, click <strong>"Check Goal"</strong> → Campaign sẽ đóng với status FAILED
                        </div>
                    </li>
                    <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center text-sm font-bold">5</span>
                        <div>
                            Click <strong>"Refund"</strong> → Tokens sẽ được hoàn lại
                        </div>
                    </li>
                </ol>
            </div>
        </div>
    );
};

export default RefundDemo;
