//Inicializa un array con los datos de ejemplo pestaña individual de la ficha de trabajo.
const literacyData = [
    { country: "Armenia", total: 99.8, male: 99.8, female: 99.7, gender_gap: 0.1, year: 2020 },
    { country: "Colombia", total: 95.6, male: 95.4, female: 95.9, gender_gap: 0.5, year: 2020 },
    { country: "Ecuador", total: 93.6, male: 94.8, female: 92.5, gender_gap: 2.3, year: 2020 },
    { country: "Indonesia", total: 96.0, male: 97.4, female: 94.6, gender_gap: 2.8, year: 2020 },
    { country: "Kuwait", total: 96.5, male: 97.1, female: 95.4, gender_gap: 1.7, year: 2020 },
    { country: "Mexico", total: 95.2, male: 96.1, female: 94.5, gender_gap: 1.6, year: 2020 },
    { country: "Mongolia", total: 99.2, male: 99.1, female: 99.2, gender_gap: 0.1, year: 2020 },
    { country: "North Macedonia", total: 98.4, male: 99.1, female: 97.6, gender_gap: 1.5, year: 2020 },
    { country: "Paraguay", total: 94.5, male: 94.9, female: 94.2, gender_gap: 0.7, year: 2020 },
    { country: "Peru", total: 94.5, male: 97.0, female: 92.0, gender_gap: 5.0, year: 2020 },
    { country: "Saudi Arabia", total: 97.6, male: 98.6, female: 96.0, gender_gap: 2.6, year: 2020 },
    { country: "Spain", total: 98.6, male: 99.0, female: 98.2, gender_gap: 0.8, year: 2020 },
    { country: "Spain", total: 99.3, male: 98.5, female: 98.1, gender_gap: 0.6, year: 2021 }
];

// Realice un algoritmo usando iteradores (forEach, Map, filter, …) que permita calcular la media de
// valores de alguna de los campos numéricos del subconjunto de filas que comparten un determinado valor
// en el campo de información geográfica.
const targetCountry = "Spain";

const filtered = literacyData.filter(d => d.country === targetCountry);

if (filtered.length > 0) {

    const averageTotal = filtered
        .map(d => d.total)
        .reduce((acc, value) => acc + value, 0) / filtered.length;

    console.log(`Media de 'total' en ${targetCountry}: ${averageTotal.toFixed(2)}%`);

} else {
    console.log(`No se encontraron datos para ${targetCountry}`);
}