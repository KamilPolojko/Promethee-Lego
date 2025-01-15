import {api} from "@/request";
import {useQuery, UseQueryResult} from "@tanstack/react-query";


export type part = {
    part_num: string;
    part_name: string;
    part_material: string;
    category_name: string;
    color_name: string;
    color_rgb: string;
    quantity: number;
    is_spare: boolean;
    part_image: string;
};

export type setResult = {
        result:{
            set_details:{
                set_num: string;
                set_name: string;
                year: number;
                total_parts: number;
                set_image: string;
                theme_name: string;
                price: number;
            },
            parts:{
                part_num: string;
                part_name: string;
                part_material: string;
                category_name: string;
                color_name: string;
                color_rgb: string;
                quantity: number;
                is_spare: boolean;
                part_image: string;
            }[];
        }
}[];

export const getSet = async (id:string) => {
    try {
        const { data } = await api.get<setResult>(`/fetch-set/${id}`);

        return data;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
};


export const useGetSet= (id:string) => {
    return useQuery({
        queryKey: ['fetch-sets'],
        queryFn:() => getSet(id),
        staleTime: Infinity,
    }) as UseQueryResult<setResult>;
}