import {api} from "@/request";
import {useQuery, UseQueryResult} from "@tanstack/react-query";


export type sets = {
    set_num: string;
    name: string;
    year:number;
    price: number;
    theme_name: string;
    num_parts: number;
    img_url: string;
    num_minifigs: number;
    addedToComparision: boolean;
}

export type categoryType={
    count: number;
    sets: sets[];
}


export const getSets = async () => {
    try {
        const { data } = await api.get<categoryType>('/fetch-sets');

        return data;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
};


export const useGetSets= () => {
    return useQuery({
        queryKey: ['fetch-sets'],
        queryFn:getSets,
    }) as UseQueryResult<categoryType>;
}