/* A) Inicializa un array con los datos de ejemplo pestaña individual de la ficha de trabajo.*/

const alcoholData = [
    { nation: "Albania", date_year: 2016, alcohol_litres: 7.5, recorded_consumption: 4.4, unrecorded_consumption: 0.7 },
    { nation: "Albania", date_year: 1996, alcohol_litres: 2.59, recorded_consumption: 4.4, unrecorded_consumption: 0.7 },
    { nation: "Albania", date_year: 2019, alcohol_litres: 5.1, recorded_consumption: 4.4, unrecorded_consumption: 0.7 },
    { nation: "Brazil", date_year: 2016, alcohol_litres: 7.8, recorded_consumption: 6.3, unrecorded_consumption: 1.4 },
    { nation: "Brazil", date_year: 2019, alcohol_litres: 7.7, recorded_consumption: 6.3, unrecorded_consumption: 1.4 },
    { nation: "Andorra", date_year: 2019, alcohol_litres: 11.3, recorded_consumption: 11.1, unrecorded_consumption: 0.4 },
    { nation: "Angola", date_year: 2016, alcohol_litres: 6.4, recorded_consumption: 5.3, unrecorded_consumption: 0.9 },
    { nation: "Argentina", date_year: 2019, alcohol_litres: 8, recorded_consumption: 7.6, unrecorded_consumption: 0.4 },
    { nation: "Armenia", date_year: 2016, alcohol_litres: 5.5, recorded_consumption: 4.1, unrecorded_consumption: 0.9 },
    { nation: "Austria", date_year: 2016, alcohol_litres: 11.6, recorded_consumption: 11.7, unrecorded_consumption: 0.4 },
    { nation: "Australia", date_year: 2016, alcohol_litres: 10.6, recorded_consumption: 9.5, unrecorded_consumption: 0.4 },
    { nation: "Denmark", date_year: 2016, alcohol_litres: 10.4, recorded_consumption: 9.2, unrecorded_consumption: 0.4 }
];
/* B) Realice un algoritmo usando iteradores (forEach, Map, filter, …) que permita calcular la media de valores de alguna de 
los campos numéricos del subconjunto de filas que comparten un determinado valor en el campo de información geográfica.*/

const targetNation = "Albania";
const filter1 = alcoholData.filter(e => e.nation === targetNation);

if (filter1.length > 0) {
    let totalAlcohol = 0;
    filter1.forEach(e => {
        totalAlcohol += e.alcohol_litres;
    });
    const average = totalAlcohol / filter1.length;
    console.log(`Resultado: La media de 'alcohol_litres' en ${targetNation} es ${average.toFixed(2)} litros.`);
} else {
    console.log(`No se encontraron datos para la nación: ${targetNation}`);
}