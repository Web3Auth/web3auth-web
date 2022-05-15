import { Oval } from "react-loader-spinner"
function Loader(){
    return (
        <Oval
            ariaLabel="loading-indicator"
            height={100}
            width={100}
            strokeWidth={5}
            color="blue"
            secondaryColor="grey"
        />
    )
}

export default Loader;