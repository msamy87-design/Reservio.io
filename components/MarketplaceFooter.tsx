
import React from 'react';
import { Link } from 'react-router-dom';
import { BusinessIcon } from './Icons';

const FooterLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
    <Link to={to} className="text-sm text-gray-400 hover:text-white transition-colors">
        {children}
    </Link>
);

const MarketplaceFooter: React.FC = () => {
    return (
        <footer className="bg-gray-800 dark:bg-black text-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="md:col-span-1">
                        <Link to="/" className="flex items-center gap-2">
                            <BusinessIcon className="h-8 w-8 text-indigo-400" />
                            <span className="text-2xl font-bold tracking-wider">Reservio</span>
                        </Link>
                        <p className="mt-4 text-sm text-gray-400">
                            The easiest way to book services online.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 md:col-span-3 gap-8">
                        <div>
                            <h3 className="font-semibold tracking-wider uppercase">Customers</h3>
                            <ul className="mt-4 space-y-2">
                                <li><FooterLink to="/search">Find a Business</FooterLink></li>
                                <li><FooterLink to="/login">My Account</FooterLink></li>
                                <li><FooterLink to="/help">Help Center</FooterLink></li>
                            </ul>
                        </div>
                         <div>
                            <h3 className="font-semibold tracking-wider uppercase">Businesses</h3>
                            <ul className="mt-4 space-y-2">
                                <li><FooterLink to="/biz/login">Business Login</FooterLink></li>
                                <li><FooterLink to="/biz/signup">Claim your Business</FooterLink></li>
                                <li><FooterLink to="/pricing">Pricing</FooterLink></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold tracking-wider uppercase">Company</h3>
                            <ul className="mt-4 space-y-2">
                                <li><FooterLink to="/about">About Us</FooterLink></li>
                                <li><FooterLink to="/careers">Careers</FooterLink></li>
                                <li><FooterLink to="/contact">Contact</FooterLink></li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-700 text-center text-sm text-gray-400">
                    &copy; {new Date().getFullYear()} Reservio, Inc. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default MarketplaceFooter;
