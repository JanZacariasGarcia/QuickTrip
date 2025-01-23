export default function PlaceImg({place, index=0, className}){
    if(!place.photos?.length){
        return '';
    }
    if(!className){
        className = 'object-cover';
    }
    return(
        <img className={"object-cover w-full h-full"} src={'http://localhost:4000/uploads/' + place.photos[index]} alt={""}/>
    );
}