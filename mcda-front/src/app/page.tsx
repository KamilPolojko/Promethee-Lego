"use client"


import React, {useState} from "react";
import ProductCard from "@/app/Product/ProductCard";
import {sets, useGetSets} from "@/hooks/useGetSets";
import Button from "@mui/material/Button";
import Select, {SelectChangeEvent} from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import {Theme, useTheme} from '@mui/material/styles';
import {Controller, useForm} from "react-hook-form";
import {sortByKey} from "@/app/product-details/[id]/page";


type filterFormValues = {
    name:string;
    set_number: string;
    category: string;
    prices: {
        from: number;
        to: number;
    };
    productionYear: {
        from: number;
        to: number;
    };
    partsQuantity: {
        from: number;
        to: number;
    };
}

const getUniqueThemes = (data: sets[] | undefined): string[] => {
    const themes = data?.map((item) => item.theme_name);
    return Array.from(new Set(themes));
};

export default function Home() {
    const [sortOrder, setSortOrder] = useState<string>('none');

    const [formData, setFormData] = useState<filterFormValues>({
        name: "",
        set_number: "",
        category: "brak",
        prices: {
            from: 0,
            to: 0,
        },
        productionYear: {
            from: 0,
            to: 0,
        },
        partsQuantity: {
            from: 0,
            to: 0,
        }

    });


    const theme = useTheme();

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const {data} = useGetSets();



    const form = useForm<filterFormValues>({
        defaultValues: {
            category: "brak",
            prices: {
                from: 0,
                to: 0,
            },
            productionYear: {
                from: 0,
                to: 0,
            },
            partsQuantity: {
                from: 0,
                to: 0,
            }

        }
    });

    const { control, handleSubmit} = form;


    const filteredProducts = data?.sets.filter((product) => {
        const matchesNameOfSet = formData.name
            ? formData.name === "" || product.name.toLowerCase().includes(formData.name.toLowerCase())
            : true;
        const matchesNumberOfSet = formData.set_number
            ? formData.set_number === "" || product.set_num.toLowerCase().includes(formData.set_number.toLowerCase())
            : true;
        const matchesCategory = formData.category
            ? formData.category === "brak" || product.theme_name.toLowerCase().includes(formData.category.toLowerCase())
            : true;
        const matchesPrice = product.price >= formData.prices.from &&( formData.prices.to ===0 || product.price <= formData.prices.to);
        const matchesYearProduction = product.year >= formData.productionYear.from &&( formData.productionYear.to ===0 || product.year <= formData.productionYear.to);
        const matchesPartsQuantity = product.num_parts >= formData.partsQuantity.from && (formData.partsQuantity.to ===0 || product.num_parts <= formData.partsQuantity.to);


        return matchesNameOfSet && matchesNumberOfSet && matchesCategory && matchesPrice && matchesYearProduction && matchesPartsQuantity;
    });

    const uniqueThemes = getUniqueThemes(data?.sets);

    function getStyles(theme: Theme) {
        return {
            fontWeight: theme.typography.fontWeightMedium
        };
    }

    function onSubmit(form:filterFormValues){
        setFormData(form);

        console.log("FILTRY", formData);
        console.log("FILTER VALUES", filteredProducts);
    }


    const sortData = (data: sets[] | undefined) => {
        switch (sortOrder) {
            case 'price_asc':
                return data?.sort((a, b) => a.price - b.price);
            case 'price_desc':
                return data?.sort((a, b) => b.price - a.price);
            case 'year_asc':
                return data?.sort((a, b) => a.year - b.year);
            case 'year_desc':
                return data?.sort((a, b) => b.year - a.year);
            case 'parts_asc':
                return data?.sort((a, b) => a.num_parts - b.num_parts);
            case 'parts_desc':
                return data?.sort((a, b) => b.num_parts - a.num_parts);
            case 'name_asc':
                return sortByKey(data? data: [],"name","asc");
            case 'name_desc':
                return sortByKey(data? data: [],"name","desc");
            case 'number_asc':
                return sortByKey(data? data: [],"set_num","asc");
            case 'number_desc':
                return sortByKey(data? data: [],"set_num","desc");
            case 'none':
                return data;
            default:
                return data;
        }
    };

    const sortedData = sortData(filteredProducts);


    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentProducts = sortedData?.slice(startIndex, endIndex);
    const totalPages = Math.ceil((sortedData? sortedData.length : 1) / itemsPerPage);

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleSortChange = (e: SelectChangeEvent) => {
        setSortOrder(e.target.value);
    };


  return (
      <main className="h-full w-full flex flex-col items-center justify-center gap-10">

          <div className={"w-full  h-full justify-items-end"}>

              <div className={"w-2/3 h-full flex items-center justify-between"}>
                  <div
                      className={"text-white flex items-center justify-center gap-5"}>Found {filteredProducts?.length} sets.
                  </div>
                  <Select
                      labelId="demo-select-small-label"
                      id="demo-select-small"
                      value={sortOrder}
                      label="Age"
                      onChange={handleSortChange}
                      variant={"standard"}
                      className={"w-[200px] h-full p-1 m-2 flex bg-white rounded-md shadow-sm mr-[100px]"}>

                      <MenuItem
                          key={'none'}
                          value={'none'}
                          style={getStyles(theme)}
                      >
                          {"No sort"}
                      </MenuItem>

                      <MenuItem
                          key={'price_asc'}
                          value={'price_asc'}
                          style={getStyles(theme)}
                      >
                          {'Price ASC'}
                      </MenuItem>

                      <MenuItem
                          key={'price_desc'}
                          value={'price_desc'}
                          style={getStyles(theme)}
                      >
                          {'Price DESC'}
                      </MenuItem>

                      <MenuItem
                          key={'year_asc'}
                          value={'year_asc'}
                          style={getStyles(theme)}
                      >
                          {'Production Year ASC'}
                      </MenuItem>

                      <MenuItem
                          key={'year_desc'}
                          value={'year_desc'}
                          style={getStyles(theme)}
                      >
                          {'Production Year DESC'}
                      </MenuItem>

                      <MenuItem
                          key={'parts_asc'}
                          value={'parts_asc'}
                          style={getStyles(theme)}
                      >
                          {'Quantity of parts ASC'}
                      </MenuItem>

                      <MenuItem
                          key={'parts_desc'}
                          value={'parts_desc'}
                          style={getStyles(theme)}
                      >
                          {'Quantity of parts DESC'}
                      </MenuItem>

                      <MenuItem
                          key={'name_asc'}
                          value={'name_asc'}
                          style={getStyles(theme)}
                      >
                          {'Name of set ASC'}
                      </MenuItem>

                      <MenuItem
                          key={'name_desc'}
                          value={'name_desc'}
                          style={getStyles(theme)}
                      >
                          {'Name of set DESC'}
                      </MenuItem>

                      <MenuItem
                          key={'number_asc'}
                          value={'number_asc'}
                          style={getStyles(theme)}
                      >
                          {'Number of set ASC'}
                      </MenuItem>

                      <MenuItem
                          key={'number_desc'}
                          value={'number_desc'}
                          style={getStyles(theme)}
                      >
                          {'Number of set DESC'}
                      </MenuItem>

                  </Select>
              </div>

          </div>

          <div className={"w-full h-full flex items-stretch justify-between"}>

              <div className={'w-[400px] h-full items-start justify-center gap-5'}>
                  <div className={"text-white"}>FILTERS:</div>
                  <div
                      className="w-full h-full flex flex-col flex-shrink-0 p-2 bg-third rounded-md items-center justify-center gap-5">

                      <form onSubmit={handleSubmit(onSubmit)} noValidate
                            className={"w-full h-full flex flex-col items-center justify-center"}>

                          <Controller
                              control={control}
                              name={'name'}
                              render={({field: {value, onChange}}) => (
                                  <div
                                      className={"w-full flex flex-col gap-[2px] items-center justify-items-start"}>
                                      <label> Name of set: </label>
                                      <input
                                          className="block w-full border p-2 rounded"
                                          type="text"
                                          placeholder="Name..."
                                          value={value || ""}
                                          onChange={(e) => onChange(e.target.value)}
                                      />
                                  </div>
                              )}
                          />

                          <Controller
                              control={control}
                              name={'set_number'}
                              render={({field: {value, onChange}}) => (
                                  <div
                                      className={"w-full flex flex-col gap-[2px] items-center justify-items-start"}>
                                      <label> Number of set: </label>
                                      <input
                                          className="block w-full border p-2 rounded"
                                          type="text"
                                          placeholder="Number of set..."
                                          value={value || ""}
                                          onChange={(e) => onChange(e.target.value)}
                                      />
                                  </div>
                              )}
                          />

                          <Controller
                              control={control}
                              name={'category'}
                              render={({field: {value, onChange}}) => (
                                  <div
                                      className={"w-full flex flex-col gap-[2px] items-center justify-items-start"}>
                                      <label> Categories: </label>
                                      <Select
                                          labelId="demo-select-small-label"
                                          id="demo-select-small"
                                          value={value}
                                          label="Age"
                                          onChange={onChange}
                                          variant={"standard"}
                                          className={"w-full h-full p-1 m-2 flex bg-white"}>

                                          <MenuItem key={'brak'} value={'brak'}
                                                    style={getStyles(theme)}>{'No category'}</MenuItem>
                                          {uniqueThemes.map((item) => (
                                              <MenuItem
                                                  key={item}
                                                  value={item}
                                                  style={getStyles(theme)}
                                              >
                                                  {item}
                                              </MenuItem>
                                          ))}
                                      </Select>
                                  </div>
                              )}
                          />

                          <Controller
                              control={control}
                              name={'prices'}
                              render={({field: {value, onChange}}) => (
                                  <div
                                      className={"w-full max-w-4xl flex flex-col gap-[2px] items-center justify-items-start"}>
                                      <label> Price of set: </label>
                                      <div className={" w-full h-full p-2 flex flex-row"}>
                                          <input
                                              className="block w-full border p-2 rounded"
                                              type="number"
                                              placeholder="from"
                                              value={value?.from }
                                              onChange={(e) => onChange({...value, from: Number(e.target.value)})}
                                              min={0}
                                          />
                                          <div className={"justify-center"}>:</div>
                                          <input
                                              className="block w-full border p-2 rounded"
                                              type="number"
                                              placeholder="to"
                                              value={value?.to || 0}
                                              onChange={(e) => onChange({...value, to: Number(e.target.value)})}
                                          />
                                      </div>

                                  </div>

                              )}
                          />

                          <Controller
                              control={control}
                              name={'productionYear'}
                              render={({field: {value, onChange}}) => (
                                  <div
                                      className={"w-full max-w-4xl flex flex-col gap-[2px] items-center justify-items-start"}>
                                      <label> Production Year: </label>
                                      <div className={" w-full h-full p-2 flex flex-row"}>
                                          <input
                                              className="block w-full border p-2 rounded"
                                              type="number"
                                              placeholder="from"
                                              value={value?.from }
                                              onChange={(e) => onChange({...value, from: Number(e.target.value)})}
                                              min={0}
                                          />
                                          <div className={"justify-center"}>:</div>
                                          <input
                                              className="block w-full border p-2 rounded"
                                              type="number"
                                              placeholder="to"
                                              value={value?.to || 0}
                                              onChange={(e) => onChange({...value, to: Number(e.target.value)})}
                                          />
                                      </div>

                                  </div>

                              )}
                          />

                          <Controller
                              control={control}
                              name={'partsQuantity'}
                              render={({field: {value, onChange}}) => (
                                  <div
                                      className={"w-full max-w-4xl flex flex-col gap-[2px] items-center justify-items-start"}>
                                      <label> Quantity of parts: </label>
                                      <div className={" w-full h-full p-2 flex flex-row"}>
                                          <input
                                              className="block w-full border p-2 rounded"
                                              type="number"
                                              placeholder="from"
                                              value={value?.from }
                                              onChange={(e) => onChange({...value, from: Number(e.target.value)})}
                                              min={0}
                                          />
                                          <div className={"justify-center"}>:</div>
                                          <input
                                              className="block w-full border p-2 rounded"
                                              type="number"
                                              placeholder="to"
                                              value={value?.to || 0}
                                              onChange={(e) => onChange({...value, to: Number(e.target.value)})}
                                          />
                                      </div>

                                  </div>

                              )}
                          />


                          <Button variant={"contained"} type={"submit"}>FILTER</Button>

                      </form>

                  </div>
              </div>

              <div className="flex flex-wrap flex-1 gap-4 ml-[20px] mb-[20px] items-center justify-center">
                  {currentProducts?.map((item, index) => (
                      <div key={index}>
                          <ProductCard item={item}/>
                      </div>
                  ))}

              </div>


          </div>

          <div style={{display: "flex", justifyContent: "center", marginTop: "20px", marginBottom: "20px"}}>
              <Button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  variant={"contained"}
              >
                  Prev Page
              </Button>

              <div className="flex justify-center items-center">
                <span className="mx-2 text-center text-white">
                    Page {currentPage} of {totalPages}
                </span>
              </div>

              <Button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  variant={"contained"}
              >
                  Next Page
              </Button>
          </div>
      </main>
  );
}
