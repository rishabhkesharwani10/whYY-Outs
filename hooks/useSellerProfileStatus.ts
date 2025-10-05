import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase.ts';
import { useAuth } from '../context/AuthContext.tsx';
import type { Seller, SellerBankDetails } from '../types.ts';

export const useSellerProfileStatus = () => {
    const { user } = useAuth();
    const [bankDetails, setBankDetails] = useState<Partial<SellerBankDetails>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBankDetails = async () => {
            if (user?.role !== 'seller') {
                setLoading(false);
                return;
            }
            setLoading(true);
            const { data, error } = await supabase
                .from('seller_bank_details')
                .select('*')
                .eq('seller_id', user.id)
                .single();

            if (data) {
                setBankDetails(data);
            }
            // Ignore 'PGRST116' error which means no row was found
            if (error && error.code !== 'PGRST116') {
                console.error("Error fetching bank details:", error.message || error);
            }
            setLoading(false);
        };
        fetchBankDetails();
    }, [user]);

    const { isProfileComplete, missingFields } = useMemo(() => {
        if (!user || user.role !== 'seller') {
            return { isProfileComplete: false, missingFields: [] };
        }
        
        const seller = user as Seller;
        const missing: string[] = [];

        // Personal details
        if (!seller.phone) missing.push('Phone Number');
        if (!seller.gender) missing.push('Gender');

        // Business details
        if (!seller.businessName) missing.push('Business Name');
        if (!seller.panNumber) missing.push('PAN Number');
        if (!seller.addressLine1 || !seller.city || !seller.state || !seller.zip) missing.push('Full Business Address');
        
        // Bank details
        if (!bankDetails.bank_name) missing.push('Bank Name');
        if (!bankDetails.account_number) missing.push('Bank Account Number');
        if (!bankDetails.ifsc_code) missing.push('IFSC Code');

        return {
            isProfileComplete: missing.length === 0,
            missingFields: missing
        };
    }, [user, bankDetails]);

    return { loading, isProfileComplete, missingFields };
};