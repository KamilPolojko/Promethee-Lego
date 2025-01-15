"use client"

import * as React from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import BalanceIcon from '@mui/icons-material/Balance';
import Button from "@mui/material/Button";
import {addToLocalStorage, getFromLocalStorage, removeFromLocalStorage} from "@/app/localstorage/localstorage";
import {useState} from "react";
import {sets} from "@/hooks/useGetSets";


export default function ProductCard({ item} : {item:sets}) {

        const choosedToComparisionList = getFromLocalStorage("choosedToComparision");

        console.log(choosedToComparisionList);

        const objectExists = choosedToComparisionList.some(
            (chosen: any) => JSON.stringify(chosen) === JSON.stringify(item)
        );

    const [isChoosen, setIsChoosen] = useState(objectExists);


    function handleFavoriteClick(){
            if(objectExists){
                removeFromLocalStorage("choosedToComparision", item);
                setIsChoosen(false);
            }
            else {
                addToLocalStorage("choosedToComparision", item);
                setIsChoosen(true);
            }
    }

    return (
        <Card
            sx={{ width:345,height:500, maxWidth: 345, maxHeight: 800, bgcolor: '#6EACDA' }}
        >
            <CardMedia
                component="img"
                height="250"
                image={item.img_url}
                alt={item.name}
                className="p-[15px] h-[250px] max-h-[250px]"
            />
            <CardHeader
                title={
                    <Typography
                        style={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontSize: 'calc(1rem * 0.8)',
                            fontWeight: 'bold',
                            justifyContent: 'space-between',
                        }}
                    >
                        {item.name}
                    </Typography>

                }
            />
            <CardContent className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                    <Typography variant="body2" sx={{color: 'text.secondary'}}>
                        <span className={"font-black"}>Price: </span>
                        {item?.price}
                    </Typography>
                    <Typography variant="body2" sx={{color: 'text.secondary'}}>
                        <span className={"font-black"}>Quantity of parts: </span>
                        {item.num_parts}
                    </Typography>
                </div>
                <div className="flex items-center justify-between">
                    <Typography variant="body2" sx={{color: 'text.secondary'}}>
                        <span className={"font-black"}>Category: </span>
                        {item?.theme_name}
                    </Typography>
                    <Typography variant="body2" sx={{color: 'text.secondary'}}>
                        <span className={"font-black"}>Production Year: </span>
                        {item.year}
                    </Typography>
                </div>

            </CardContent>
            <CardActions className="flex items-center justify-between">
                <IconButton
                    aria-label="add to favorites"
                    onClick={() =>handleFavoriteClick()}
                    sx={{
                        color: isChoosen ? 'red' : 'black',
                    }}
                >
                    <BalanceIcon/>
                </IconButton>
                <Button variant="contained" href={`/product-details/${item.set_num}`}>More Details</Button>
            </CardActions>

        </Card>
    );
}
