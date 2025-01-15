'use client'

import * as React from 'react';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import {useForm, useFieldArray, Controller} from "react-hook-form";
import {Slider} from "@mui/material";
import {useEffect} from "react";
import {api} from "@/request";
import useSWR from "swr";
import {getFromLocalStorage} from "@/app/localstorage/localstorage";
import CardMedia from "@mui/material/CardMedia";
import clsx from "clsx";
import Button from "@mui/material/Button";
import PrometheeRankingChart from "@/components/RankingChart";
import GAIAChart from "@/components/GAIAChart";
import {sets} from "@/hooks/useGetSets";


const getOutput = async (
    url: string,
) => {
    try {
        const { data } = await api.get<mcdaOutputValues>(url);

        return data;
    } catch (error) {
        console.error("Fetch error:", error);
        throw error;
    }
};

type mcdaOutputValues = {
    sets :sets[];
    criterias: {
        name: string;
        weight: number;
        Q: number;
        P: number;
        S: number;
        type: string;
        promethee2Method: string;
    }[];
    rankings:{
        name: string;
        value: number;
    }[];
    gaia_properties:{
        criterias:{
            name:string;
            x: number;
            y: number;
        }[];
        alternatives:{
            name: string;
            x:number;
            y:number;
        }[];
        explained_variance: number[];
    };
    decision_axis: number[];

}

type mcdaInputValues = {
    sets :sets[];
    criterias: {
        name: string;
        weight: number;
        Q: number;
        P: number;
        S: number;
        type: string;
        promethee2Method: string;
    }[];
}

export type Formvalues = {
    criterias: {
        name: string;
        weight: number;
        Q: number;
        P: number;
        S: number;
        type: string;
        promethee2Method: string;
    }[];
}

const toQueryString = (formValues: mcdaInputValues): string => {
    const criteriasParams = formValues.criterias
        .map((criteria, index) => {
            return Object.entries(criteria)
                .map(([key, value]) => `criterias[${index}][${key}]=${encodeURIComponent(value)}`)
                .join("&");
        });

    const setsParams = formValues.sets
        .map((set, index) => {
            return Object.entries(set)
                .map(([key, value]) => `sets[${index}][${key}]=${encodeURIComponent(value)}`)
                .join("&");
        });

    return [...criteriasParams, ...setsParams].join("&");
};

export default function MCDA() {

    const sets = getFromLocalStorage("choosedToComparision");


    const form = useForm<Formvalues>({
        defaultValues: {
            criterias: [
                {
                    name: '',
                    weight: 100,
                    Q:0,
                    P:0,
                    S:0,
                    type: "MAX",
                    promethee2Method: "",
                }
            ],
        }
    });

    const {control, handleSubmit, setValue, watch} = form;

    const {fields, append, remove} = useFieldArray({
        name: `criterias`,
        control,
    })

    const sliders = watch('criterias');

    const watchedValues = watch();

    const updateValues = (index: number, newValue: number) => {
        const total = sliders.reduce((sum, slider) => sum + slider.weight, 0);
        const diff = newValue - sliders[index].weight;
        const othersTotal = total - sliders[index].weight;

        const updated = sliders.map((slider, i) => {
            if (i === index) {
                return {...slider, weight: newValue};
            } else {
                const proportion = othersTotal > 0 ? slider.weight / othersTotal : 1 / (sliders.length - 1);
                return {...slider, weight: Math.max(0, slider.weight - diff * proportion)};
            }
        });

        const correctedTotal = updated.reduce((sum, slider) => sum + slider.weight, 0);

        const delta = 100 - correctedTotal;
        if (delta !== 0) {
            updated[0].weight += delta;
        }

        setValue("criterias", updated);
    };

    useEffect(() => {
        handleSubmit(onSubmit)();
    }, [watchedValues]);

    const { data, mutate } = useSWR("http://127.0.0.1:8000/get-output",getOutput);

    const onSubmit = async (formData: Formvalues) => {

        const criterias = formData.criterias
        const final = {
            sets,
            criterias,
        }
        const queryString = toQueryString(final);
        const url = `http://127.0.0.1:8000/get-output?${queryString}`;

        try {
            await mutate(
                async () => {
                    const result = await getOutput(url);
                    return result;
                },
                {
                    revalidate: false,
                }
            );
        } catch (error) {
            console.error('Mutation failed:', error);
        }
    };


    return (
        <div className="flex flex-col w-full h-full items-center justify-center bg-white rounded-md gap-5 pt-[63px]">
            {
                (
                    <form noValidate
                          className={'w-full flex flex-col items-center justify-start pl-3 pr-3 pb-3 gap-7'}>
                        <div>
                            <label>Criterias and their Weights</label>
                        </div>
                        <div className={"w-full h-full flex flex-col"}>
                            {fields.map((field, index) => (
                                <div key={field.id}
                                     className={"flex items-center justify-center mb-2 gap-[6px]"}>
                                    <Controller
                                        control={control}
                                        name={`criterias.${index}.name`}
                                        render={({field: {value, onChange}}) => (
                                            <Select
                                                labelId="demo-select-small-label"
                                                id="demo-select-small"
                                                value={value}
                                                label="Age"
                                                onChange={onChange}
                                                variant={"outlined"}
                                                className={"w-[450px] h-[50px] m-2"}>

                                                <MenuItem value={1}>Rarity of all parts of the set</MenuItem>
                                                <MenuItem value={2}>Production Year</MenuItem>
                                                <MenuItem value={3}>Total number of parts</MenuItem>
                                                <MenuItem value={4}>Number of blocks compatible with other
                                                    sets</MenuItem>
                                                <MenuItem value={5}>Number of individual parts</MenuItem>
                                                <MenuItem value={6}>Number of unique parts</MenuItem>
                                                <MenuItem value={7}>Total of all spare parts for set</MenuItem>
                                                <MenuItem value={8}>Price of set</MenuItem>
                                                <MenuItem value={9}>Unit price per block</MenuItem>
                                                <MenuItem value={10}>Number of minifigures in the set</MenuItem>
                                            </Select>
                                        )}
                                    />

                                    <Controller
                                        control={control}
                                        name={`criterias.${index}.weight`}
                                        render={({field: {value, onChange}}) => (
                                            <Slider
                                                value={value}
                                                onChange={(e, newValue) => {
                                                    if (typeof newValue === "number") {
                                                        updateValues(index, newValue);
                                                        onChange(newValue);
                                                    }
                                                }}
                                                min={0}
                                                max={100}
                                                step={1}
                                                style={{marginRight: "10px", flex: 1, width: "200px"}}
                                            />
                                        )}
                                    />
                                    <span style={{marginRight: "10px"}}>
                                     {sliders[index].weight.toFixed(2)}%
                                    </span>

                                    <Controller
                                        control={control}
                                        name={`criterias.${index}.Q`}
                                        render={({field: {value, onChange}}) => (
                                            <div>
                                                <label>Q: </label>
                                                <input step={0.01} value={value} onChange={onChange} type="number"
                                                       className={"w-[80px] h-[50px]"}/>
                                            </div>

                                        )}
                                    />
                                    <Controller
                                        control={control}
                                        name={`criterias.${index}.P`}
                                        render={({field: {value, onChange}}) => (
                                            <div>
                                                <label>P: </label>
                                                <input step={0.01} value={value} onChange={onChange} type="number"
                                                       className={"w-[80px] h-[50px]"}/>
                                            </div>

                                        )}
                                    />

                                    <Controller
                                        control={control}
                                        name={`criterias.${index}.type`}
                                        render={({field: {value, onChange}}) => (
                                            <div>

                                                <label>Type: </label>
                                                <Select
                                                    labelId="demo-select-small-label"
                                                    id="demo-select-small"
                                                    value={value}
                                                    label="Age"
                                                    onChange={onChange}
                                                    variant={"outlined"}
                                                    className={"w-[90px] h-[50px]"}>

                                                    <MenuItem value={1}>MAX</MenuItem>
                                                    <MenuItem value={-1}>MIN</MenuItem>
                                                </Select>

                                            </div>
                                        )}
                                    />

                                    <Controller
                                        control={control}
                                        name={`criterias.${index}.promethee2Method`}
                                        render={({field: {value, onChange}}) => (
                                            <div>

                                                <label>Preference function: </label>
                                                <Select
                                                    labelId="demo-select-small-label"
                                                    id="demo-select-small"
                                                    value={value}
                                                    label="Age"
                                                    onChange={onChange}
                                                    variant={"outlined"}
                                                    className={"w-[120px] h-[50px]"}>

                                                    <MenuItem value={"usual"}>Usual</MenuItem>
                                                    <MenuItem value={"u-shape"}>Ushape</MenuItem>
                                                    <MenuItem value={"v-shape"}>V-shape</MenuItem>
                                                    <MenuItem value={"level"}>Level</MenuItem>
                                                    <MenuItem value={"gaussian"}>Gaussian</MenuItem>
                                                    <MenuItem value={"linear"}>Linear</MenuItem>
                                                </Select>

                                            </div>
                                        )}
                                    />

                                    <Button
                                        type="button"
                                        onClick={() => remove(index)}
                                        disabled={fields.length === 1}
                                        variant={"contained"}
                                        color={"error"}
                                    >
                                        DELETE
                                    </Button>
                                </div>
                            ))}

                            <div className={"w-full h-full flex items-center justify-center mb-3"}>
                                <Button
                                    type="button"
                                    onClick={() => append({
                                        name: `Slider ${fields.length + 1}`,
                                        weight: 0,
                                        Q: 0,
                                        P: 0,
                                        S: 0,
                                        type: "MAX",
                                        promethee2Method: "usual"
                                    })}
                                    variant={"contained"}
                                    color={"warning"}
                                    className={'w-[200px] flex justify-center '}
                                >
                                    Add New Criteria
                                </Button>
                            </div>
                        </div>

                    </form>

                )
            }


            <div className={"flex"}>Sets result of comparision: </div>

            <div className={'flex flex-col w-[500px] h-auto' +
                ' bg-white items-start justify-items-start'}>
                {
                    data?.sets && data?.sets?.length > 0 ? (
                        data?.sets.map((choosenItem, index) => {

                            return (
                                <div key={index + 1}
                                     className={"flex flex-row w-[500px] h-full items-start justify-items-start"}>
                                    <div
                                        className={clsx("h-[80px] w-[100px] flex items-center justify-center border-white border-[1px]", index + 1 === 1 ? "bg-yellow-500" : "bg-gray-400")}>
                                        <div>{index + 1}</div>
                                    </div>
                                    <div
                                        className="w-full h-[80px] flex flex-row items-center justify-between border-[1px] border-white text-white p-2 bg-secondary">
                                        <div
                                            className={"w-full gap-[5px] flex flex-row items-center justify-between"}>
                                            <span className="text-lg font-bold">{choosenItem.name}</span>
                                            <span>{choosenItem.price}</span>
                                            <div className="relative flex h-[40px] w-[40px]">
                                                <CardMedia
                                                    component="img"
                                                    image={choosenItem.img_url}
                                                    alt={choosenItem.name}
                                                />
                                            </div>

                                        </div>
                                    </div>

                                </div>

                            )

                        })
                    ) : (
                        <span className={"w-full h-full flex"}>No result, please choose criterias and fill in the values </span>
                    )
                }
            </div>


            <div className={"w-full h-full flex flex-row items-center justify-center"}>
                <div className={"w-full h-auto flex flex-col items-center justify-center gap-5"}>
                    <span> Ranking Chart: </span>
                    <div className={"flex items-center justify-center"}>
                        <PrometheeRankingChart rankings={data?.rankings}/>
                    </div>
                </div>

                <div className={"w-full h-auto flex flex-col items-center justify-center gap-5"}>
                    <span> GAIA's Chart: </span>
                    <div className={"flex items-center justify-center"}>
                        <GAIAChart properties={data?.gaia_properties} decisionAxis={data?.decision_axis}/>
                    </div>
                </div>


            </div>


        </div>

    );
}
