// Chakra imports
import {
    Box,
    Button,
    Flex,
    Icon,
    Text,
    useColorModeValue,
  } from "@chakra-ui/react";
  // Custom components
  import Card from "components/card/Card.js";
  import Calendar from "react-calendar";
  import { MdChevronLeft, MdChevronRight } from "react-icons/md"
  import axios from "axios";
  import { json2csv } from 'json-2-csv';
  import { useState } from "react";
  import React from "react";
  
  export default function DownloadTrades(props) {
    const { used, total, ...rest } = props;

    //State
    const [value, onChange] = useState([null, null]);

    // Chakra Color Mode
    const textColorPrimary = useColorModeValue("secondaryGray.900", "white");
    const textColorSecondary = "gray.400";

    //Get Orders In the specified Date range
    async function getOrdersInRage(){      
      const response = await axios({
        method: 'get',
        url: '/api/orders',
        params: {
          status: 'closed',
          limit: 1000,
          after: value[0] ? value[0].toUTCString() : '',
          until: value[1] ? value[1].toUTCString() : '',
          nested: true
        },
      });

      //Download the file
      const csv = await json2csv(response.data, {emptyFieldValue: ''})  
      const link = document.createElement('a')
      link.href = 'data:text/csv,' + encodeURIComponent(csv)
      link.download = `Trades_${value[0].toLocaleDateString('en-us', { weekday:"long", year:"numeric", month:"short", day:"numeric"})}_to_${value[1].toLocaleDateString('en-us', { weekday:"long", year:"numeric", month:"short", day:"numeric"})}`
      link.click()

      console.log(response.data)
    }

    return (
      <Card {...rest} mb='20px' align='center' p='20px'>
        <Flex h='100%' direction={{ base: "column", "2xl": "row" }} justifyContent='center'>          
          <Flex direction='column' justifyContent='center'>             
            <Text
              color={textColorPrimary}
              fontWeight='bold'
              textAlign='start'
              fontSize='2xl'
              mt={{ base: "10px", "2xl": "20px" }}>
              Descargar Ordenes Cerradas
            </Text>
            <Text
              color={textColorSecondary}
              fontSize='md'
              my={{ base: "20px", "2xl": "20px" }}         
              textAlign='start'>
              Seleccionar el rango de fechas de las ordenes a descargar.
            </Text>
            <Flex w='100%' flexDirection='column' mt='20px' alignItems='center'>
                <Calendar                    
                    onChange={onChange}
                    value={value}
                    selectRange={true}
                    defaultView={"month"}
                    showNavigation={true}
                    maxDate={new Date()}
                    goToRangeStartOnSelect={false}
                    defaultActiveStartDate = {value[1]}
                    tileContent={<Text color='brand.500'></Text>}
                    prevLabel={<Icon as={MdChevronLeft} w='24px' h='24px' mt='4px' />}
                    nextLabel={<Icon as={MdChevronRight} w='24px' h='24px' mt='4px' />}
                />
                <Button
                    mb='50px'
                    w='140px'
                    minW='140px'
                    mt={{ base: "30px", "2xl": "30px" }}
                    variant='brand'
                    fontWeight='500'
                    onClick={getOrdersInRage}>
                    Descargar
                </Button>
            </Flex>
          </Flex>
        </Flex>
      </Card>
    );
  }
  