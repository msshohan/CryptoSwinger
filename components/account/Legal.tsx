import React from 'react';

const LegalSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-brand-surface p-6 rounded-lg border border-brand-border">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <div className="prose prose-invert max-w-none text-brand-text-secondary space-y-4">
            {children}
        </div>
    </div>
);

export const Legal: React.FC = () => {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Legal Information</h1>
                <p className="text-brand-text-secondary mt-1">Privacy Policy and Terms & Conditions for CryptoCalculatorPro.</p>
            </div>

            <LegalSection title="Privacy Policy">
                <p><strong>Last Updated:</strong> July 26, 2024</p>
                <p>
                    Welcome to CryptoCalculatorPro ("we," "our," or "us"). We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our web application (the "Service").
                </p>

                <h3 className="text-xl font-semibold text-brand-text-primary">1. Information We Collect</h3>
                <p>We collect two types of information:</p>
                <ul>
                    <li>
                        <strong>Personal Account Information:</strong> When you create an account, we collect personal information, such as your first name, last name, and email address. This information is used solely for account management, authentication, and communication purposes (e.g., password resets).
                    </li>
                    <li>
                        <strong>Trade & Position Data:</strong> All data you enter into the calculator and trade logger—including cryptocurrency pairs, prices, amounts, leverage, notes, and any other trade-related details—is stored **locally on your device's web browser storage (localStorage)**. This information is **NEVER** transmitted to or stored on our servers. We do not have access to your trading data.
                    </li>
                </ul>

                <h3 className="text-xl font-semibold text-brand-text-primary">2. How We Use Your Information</h3>
                <ul>
                    <li><strong>To Provide the Service:</strong> We use your account information to secure your account and provide you with access to the Service.</li>
                    <li><strong>To Maintain the Service:</strong> Your trading data remains on your device to allow the app to function as your personal calculator and ledger. You are in full control of this data.</li>
                    <li><strong>For Communication:</strong> We may use your email to send important service-related notices, such as security alerts or password reset links.</li>
                </ul>
                
                <h3 className="text-xl font-semibold text-brand-text-primary">3. Data Storage and Security</h3>
                <p>
                    Your **Personal Account Information** is stored on secure servers, and we take reasonable measures to protect it from unauthorized access.
                </p>
                <p>
                    Your **Trade & Position Data** is your responsibility. Since it is stored locally, its security depends on the security of your device and browser. Clearing your browser's cache or storage may permanently delete this data. We recommend using the "Export to Excel" feature to back up your ledger regularly.
                </p>

                <h3 className="text-xl font-semibold text-brand-text-primary">4. Data Sharing</h3>
                <p>
                    We do not sell, trade, rent, or otherwise share your Personal Account Information with third parties for marketing purposes. We will not disclose your personal information except as required by law.
                </p>

                <h3 className="text-xl font-semibold text-brand-text-primary">5. Cookies and Local Storage</h3>
                <p>
                    We use browser cookies for session management and authentication. We use `localStorage` to store your application data (trades and positions) on your computer, as described above.
                </p>

                <h3 className="text-xl font-semibold text-brand-text-primary">6. Changes to This Policy</h3>
                <p>
                    We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.
                </p>

                 <h3 className="text-xl font-semibold text-brand-text-primary">7. Contact Us</h3>
                <p>
                    If you have any questions about this Privacy Policy, please contact us at [contact@cryptocalculatorpro.com].
                </p>
            </LegalSection>

            <LegalSection title="Terms & Conditions">
                <p><strong>Last Updated:</strong> July 26, 2024</p>
                <p>Please read these Terms and Conditions ("Terms") carefully before using the CryptoCalculatorPro web application (the "Service"). Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms.</p>

                <h3 className="text-xl font-semibold text-brand-text-primary">1. Description of Service</h3>
                <p>
                    CryptoCalculatorPro is a tool for simulating and logging cryptocurrency trades. It allows users to calculate potential profit and loss, manage virtual positions, and maintain a personal trade ledger for educational and analytical purposes. The Service does not connect to any cryptocurrency exchanges and does not facilitate the execution of real trades.
                </p>

                <h3 className="text-xl font-semibold text-brand-text-primary">2. No Financial Advice</h3>
                <p>
                    <strong>IMPORTANT:</strong> The information, calculations, and tools provided by the Service are for informational and educational purposes only. The Service does not provide financial, investment, or trading advice. You should not construe any such information as a recommendation to buy, sell, or hold any cryptocurrency. You bear sole responsibility for your own trading and investment decisions.
                </p>

                <h3 className="text-xl font-semibold text-brand-text-primary">3. Disclaimer of Warranty and Limitation of Liability</h3>
                <p>
                    The Service is provided on an "AS IS" and "AS AVAILABLE" basis. We make no warranty that the calculations are free of errors. Due to the complexity of exchange fee structures, liquidation models, and market volatility, the estimates provided (such as PnL, ROI, and liquidation price) may differ from actual outcomes.
                </p>
                <p>
                    In no event shall CryptoCalculatorPro or its owners be liable for any financial loss, loss of data, or other damages incurred as a result of using the Service. You agree to use this tool at your own risk.
                </p>
                
                <h3 className="text-xl font-semibold text-brand-text-primary">4. User Responsibilities</h3>
                <ul>
                    <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                    <li>You are responsible for the accuracy of the data you input into the Service.</li>
                    <li>You are responsible for the security of your device and for backing up your locally stored trading data.</li>
                </ul>

                <h3 className="text-xl font-semibold text-brand-text-primary">5. Termination</h3>
                <p>
                    We may terminate or suspend your access to the Service immediately, without prior notice, for any reason whatsoever, including a breach of these Terms.
                </p>
                
                <h3 className="text-xl font-semibold text-brand-text-primary">6. Governing Law</h3>
                <p>
                    These Terms shall be governed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions.
                </p>

                <h3 className="text-xl font-semibold text-brand-text-primary">7. Changes to Terms</h3>
                <p>
                    We reserve the right to modify or replace these Terms at any time. We will provide notice of any significant changes.
                </p>
            </LegalSection>
        </div>
    );
};