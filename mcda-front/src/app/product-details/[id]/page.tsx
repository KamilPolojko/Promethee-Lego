'use client'

import {use, useEffect, useState} from "react";
import {part, useGetSet} from "@/hooks/useGetSet";
import CardMedia from "@mui/material/CardMedia";
import * as React from "react";
import MenuItem from "@mui/material/MenuItem";
import Select, {SelectChangeEvent} from "@mui/material/Select";
import {Theme, useTheme} from "@mui/material/styles";

interface Props {
    params: Promise<{ id: string }>;
}

function getStyles(theme: Theme) {
    return {
        fontWeight: theme.typography.fontWeightMedium
    };
}

/**
 * @param key - The property to sort by.
 * @param order - "asc" for ascending, "desc" for descending.
 */
export function sortByKey<T>(array: T[], key: keyof T, order: "asc" | "desc" = "asc"): T[] {
    return array.sort((a, b) => {
        const comparison = String(a[key]).localeCompare(String(b[key]));
        return order === "asc" ? comparison : -comparison;
    });
}

export default function ProductDetail({ params }: Props) {
    const [sortOrder, setSortOrder] = useState<string>('none');

        const theme = useTheme();

        const { id } = use(params);

        const set = useGetSet(id);

        const sets_details = set.data? set.data[0]?.result : null;

    const sortData = (data: part[] | undefined) => {
        switch (sortOrder) {
            case 'color_asc':
                return sortByKey(data? data: [],"color_rgb","asc");
            case 'color_desc':
                return sortByKey(data? data: [],"color_rgb","desc");
            case 'part_asc':
                return sortByKey(data? data: [],"part_num","asc");
            case 'part_desc':
                return sortByKey(data? data: [],"part_num","desc");
            case 'category_asc':
                return sortByKey(data? data: [],"category_name","asc");
            case 'category_desc':
                return sortByKey(data? data: [],"category_name","desc");
            case 'quantity_asc':
                return data?.sort((a, b) => a.quantity - b.quantity);
            case 'quantity_desc':
                return data?.sort((a, b) => b.quantity - a.quantity);
            case 'none':
                return data;
            default:
                return data;
        }
    };

    const sortedData = sortData(sets_details?.parts);

    const handleSortChange = (e: SelectChangeEvent) => {
        setSortOrder(e.target.value);
    };

    return(

        <div>
            <div className={"w-full h-auto flex bg-white items-center justify-center gap-10 p-6"}>
                <span className={"text-6xl font-bold text-black"}>LEGO SET</span>
                <span className={"text-6xl font-bold text-black"}>{sets_details?.set_details.set_num}</span>
                <span className={"text-6xl font-bold text-black"}>{sets_details?.set_details.set_name}</span>

            </div>


            <div className="w-full h-screen flex flex-row items-start justify-between bg-secondary p-3">
                <div className={'w-full h-full flex flex-col gap-5'}>
                    <CardMedia
                        component="img"
                        height="250"
                        image={sets_details?.set_details.set_image}
                        alt={sets_details?.set_details.set_name}
                        className="p-[15px] h-[650px] w-[250px]"
                    />

                    <div
                        className=" w-full h-auto flex flex-wrap flex-1 gap-4 items-center justify-center">
                        <div className={"w-full h-auto flex  items-center justify-center"}>
                            <Select
                                labelId="demo-select-small-label"
                                id="demo-select-small"
                                value={sortOrder}
                                label="Age"
                                onChange={handleSortChange}
                                variant={"standard"}
                                className={"w-[200px] h-[40px] p-1 m-2 flex bg-white rounded-md shadow-sm mr-[100px]"}>

                                <MenuItem
                                    key={'none'}
                                    value={'none'}
                                    style={getStyles(theme)}
                                >
                                    {"No sort"}
                                </MenuItem>

                                <MenuItem
                                    key={'color_asc'}
                                    value={'color_asc'}
                                    style={getStyles(theme)}
                                >
                                    {'Color ASC'}
                                </MenuItem>

                                <MenuItem
                                    key={'color_desc'}
                                    value={'color_desc'}
                                    style={getStyles(theme)}
                                >
                                    {'Color DESC'}
                                </MenuItem>

                                <MenuItem
                                    key={'part_asc'}
                                    value={'part_asc'}
                                    style={getStyles(theme)}
                                >
                                    {'Part ASC'}
                                </MenuItem>

                                <MenuItem
                                    key={'part_desc'}
                                    value={'part_desc'}
                                    style={getStyles(theme)}
                                >
                                    {'Part DESC'}
                                </MenuItem>

                                <MenuItem
                                    key={'category_asc'}
                                    value={'category_asc'}
                                    style={getStyles(theme)}
                                >
                                    {'Category ASC'}
                                </MenuItem>

                                <MenuItem
                                    key={'category_desc'}
                                    value={'category_desc'}
                                    style={getStyles(theme)}
                                >
                                    {'Category DESC'}
                                </MenuItem>

                                <MenuItem
                                    key={'quantity_asc'}
                                    value={'quantity_asc'}
                                    style={getStyles(theme)}
                                >
                                    {'Quantity ASC'}
                                </MenuItem>

                                <MenuItem
                                    key={'quantity_desc'}
                                    value={'quantity_desc'}
                                    style={getStyles(theme)}
                                >
                                    {'Quantity DESC'}
                                </MenuItem>

                            </Select>
                        </div>
                        <div className={"w-full h-auto flex flex-wrap flex-1 gap-5 mb-5"}>
                            {sortedData?.map((item, index) => (
                                <div key={index} className={"bg-white w-[140px] h-[170px] flex flex-col items-center justify-center rounded-md "}>
                                    <CardMedia
                                        component="img"
                                        image={item?.part_image}
                                        alt={item?.part_name}
                                        className=" h-[130px] w-[150px] p-3"
                                    />
                                    <span>{`${item?.quantity} x ${item?.part_num}`}</span>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>

                <div className={"w-[400px] h-auto rounded-md flex flex-col bg-black justify-start items-center gap-4 border-2 border-white"}>
                    <span className={"text-white pt-2"}>{sets_details?.set_details.set_num}</span>

                    <div
                        className={"w-full h-[60px] flex flex-row items-center justify-between border-b-white border-b-[1px] border-t-[1px] p-3 text-white"}>
                        <span>Name</span>
                        <div>
                            {sets_details?.set_details.set_name}
                        </div>
                    </div>

                    <div
                        className={"w-full h-[60px] flex flex-row items-center justify-between border-b-white border-b-[1px] border-t-[1px] p-3 text-white"}>
                        <span>Released</span>
                        <div>
                            {sets_details?.set_details.year}
                        </div>
                    </div>

                    <div
                        className={"w-full h-[60px] flex flex-row items-center justify-between border-b-white border-b-[1px] border-t-[1px] p-3 text-white"}>
                        <span>Inventory</span>
                        <div>
                            {`${sets_details?.set_details.total_parts} parts`}
                        </div>
                    </div>

                    <div
                        className={"w-full h-[60px] flex flex-row items-center justify-between border-b-white border-b-[1px] border-t-[1px] p-3 text-white"}>
                        <span>Theme</span>
                        <div>
                            {sets_details?.set_details.theme_name}
                        </div>
                    </div>

                    <div
                        className={"w-full h-[60px] flex flex-row items-center justify-between border-b-white border-b-[1px] border-t-[1px] p-3 text-white"}>
                        <span>Price</span>
                        <div>
                            {sets_details?.set_details.price}
                        </div>
                    </div>


                </div>

            </div>

        </div>

    )
}