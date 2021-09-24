const CrmLeadExport =require('../model/CrmLeadExport');
const CrmConnectionDetail=require('../model/CrmConnectionDetails');
const CrmIntegrationMappingTemplate =require('../model/CrmIntegrationMappingTemplate');
const User =require('../model/User');
const Company =require('../model/Company');
const finance =require('../model/Finance');
const mongoose = require('mongoose');
const axios=require('axios');

const marketoHandler = module.exports={}

/*
This function do the message processing 
@param crmLeadExport object as crmLead
*/
marketoHandler.processLead= async (crmLead)=>{
    console.log("Inside function processLeads"); 
    let error={ requestId:"NA",response:[],success:false};
    
    let crmMappingTemplate;
    let leadData;
    let connection;
    let token;
    try{
      crmMappingTemplate= await CrmIntegrationMappingTemplate.get(crmLead.templateId);
    }catch(crmMappingTemplateError)
    {
        console.error("Error occured while fetching the crmIntegrationMappingTemplate "+crmMappingTemplateError);
        error.response.push({ reasons:[{ message:crmMappingTemplateError.toString() }] });
        return error;
    }
    if(crmMappingTemplate)
    {
        console.log("crmMappingTemplate "+crmMappingTemplate);
        try {
            leadData = await marketoHandler.createLeadData(crmLead.sourceCollection,crmMappingTemplate.fieldMappings);
        } catch (leadDataError) {
            console.error("Error occured while creating lead data ."+leadDataError);
            error.response.push({ reasons:[{ message:leadDataError.toString() }] });
            return error;  
        }
        try {
            connection = await CrmConnectionDetail.findByOrganizatioAndCrm(crmLead.organizationId,crmLead.crm);
        } catch (connectionDetailsError) {
            console.error("Error occured while creating lead data ."+connectionDetailsError);
            error.response.push({ reasons:[{ message:connectionDetailsError.toString() }] });
            return error;
        }
                
        if(leadData && connection)
        {
            try {
                token = await marketoHandler.getToken(connection);             
            } catch (tokenError) {
                console.error("Error occured while generating token ."+tokenError);
                error.response.push({ reasons:[{ message:tokenError.toString() }] });
                return error;
            }
            if(token.status)
            {
                let responseFromMarketo ;
                try {
                    responseFromMarketo = await marketoHandler[crmMappingTemplate.platform](...[crmMappingTemplate.programName,connection,token.token,leadData]);
                    
                } catch (UploadError) {
                    console.error("Error occured while uploading leadData to marketoHandler ."+UploadError);
                    error.response.push({ reasons:[{ message: UploadError.toString()}] });
                    return error;
                }
                console.log("response"+ JSON.stringify(responseFromMarketo));
                return responseFromMarketo ;
            }
            else
            { 
                error.response.push({ reasons:[{ message:token.error.toString() }] });
                return error;     
            }
        }
        else 
        {
            error.response.push({ reasons:[{ message:"LeadData  was not found or connection details were invalid/not found ." }] });
            return error;  
        }
    }
    else
    { 
        error.response.push({ reasons:[{ message:"CrmIntegration Mapping template was not found " }] });
        return error;  
    }
}

/*
This function creates the leadData/lead json that will be exported to Marketo 
@param sourceCollection Array from leadExport as sourceCollection, fieldMappings Array from crmIntegrationMappingTemplate as fieldMappings
*/
marketoHandler.createLeadData = async (sourceCollection,fieldMappings)=>{
    console.log("Inside Method createLeadData");
    const sourceCollectionWithDocument =[];
    for(const element of sourceCollection) {
        const sourceDocument={};
        // creating the model from the sourceCollection in the crmLeadExport
        const model=mongoose.model(element.collectionName);
        sourceDocument[element.collectionName] = await model.get(element.collectionId);
        sourceCollectionWithDocument.push(sourceDocument);
        console.log("Source document "+ JSON.stringify(sourceDocument) );

    }
    console.log("sourceCollectionWithDocument "+JSON.stringify(sourceCollectionWithDocument)); 
    const leadData={} ;
    for(const mappingElement of fieldMappings)
    {    
        const destinationField =   mappingElement.destinationFieldName;
        for(const elementValue of sourceCollectionWithDocument)
        {
           if(elementValue[mappingElement.sourceObject])
           {
                let destinationFieldValue ='';
                if(elementValue[mappingElement.sourceObject].get(mappingElement.sourceFieldName))
                  destinationFieldValue = elementValue[mappingElement.sourceObject].get(mappingElement.sourceFieldName);
                else
                {
                   console.error("Value for the field "+mappingElement.sourceFieldName+"not found ") ;
                   return ; 
                }
                console.log(" Value for destinationField "+ destinationFieldValue); 
                leadData[destinationField]=destinationFieldValue ;
           }
           
        }      
    }  
    return leadData ;
}

/*
This method generates a marketo token 
@param connectionDetail object as connection
*/
marketoHandler.getToken = async (connection)=>{
    console.log("Inside Method getToken");

    const result=await axios.get(connection.instanceUrl+"/identity/oauth/token?grant_type=client_credentials&client_id="+connection.clientId+"&client_secret="+connection.clientSecret,headers={'accept':'application/json'})
    .then( (resp)=>{   
       console.log("access token = "+resp.data.access_token);
       return ({status:true,token:resp.data.access_token}) ;
    })
    .catch((connectionError)=>{
       console.error("Error occured while creating a connection with marketoHandler ."+connectionError) ;
       return  ({status:false ,error:connectionError}) ;
    });
    return result; 
    
}

/*
This method creates the post json for the pushing the lead to marketo in a program to export the lead
@param programName from the mapping template as programName , connectionDetail object as connection 
 authtoken from marketo as token , leadData / json that need to be pushed to marketo as leadData
*/
marketoHandler.marketo_campaign = async (programName,connection,token,leadData)=>{
    console.log("Inside Method marketo_campaign");
    let isLeadUploaded=false ;
    const postApi = connection.instanceUrl+"/rest/v1/leads/push.json?access_token=";
    const postJson={   
                        method:'post',
                        url:postApi+token,
                        headers:{'accept':'application/json'},
                        data:{
                            "programName": programName,
                            "lookupField":"email",
                            "input":[leadData]
                            } 
                };
   
        const response = await marketoHandler.postData(postJson);

        if(response){
            if(response.result){
                console.log("Response "+JSON.stringify(response.result));
                response.result.forEach(element=>{
                     if(element && element.id && element.status && (element.status =='created' || element.status =='updated'))
                         isLeadUploaded=true;   
                 });
             }
             if(isLeadUploaded)
             { 
                 const responseFromMarketo= { requestId:response.requestId , response:response.result,success:true};
                 console.log("Lead is sent to marketo ");
                 return responseFromMarketo ;
             }
             else
             {   // Case if some error occured while exporting the lead   
                 if(!response.success && response.errors){
                    console.log("success is false and we have got some errors"+response.errors);
                    const responseFromMarketo= { requestId:response.requestId , response:response.errors,success:false};    
                    return responseFromMarketo ;
                 }
                 else{ 
                    const responseFromMarketo= { requestId:response.requestId , response:response.result,success:false};    
                    return responseFromMarketo ;
                 }  
             } 
        }
        else{
            const responseFromMarketo= { requestId:'' , response:"error ocuured while pushing lead to marketo .",success:false};    
            return responseFromMarketo ;
        }

}

/*
This method do a post call .
@param postJson a json object with url and other required field when pushing the lead to marketo as postJson
*/
marketoHandler.postData = async (postJson)  =>{  
  console.log("Inside Method postData"+ JSON.stringify(postJson));  
  const response = await axios(postJson)
  .then((res=>{
         console.log("Response from marketoHandler "+ JSON.stringify(res.data)) ; 
         return res.data ;
  }))
  .catch((err)=>{
      console.error("Error recieved from marketoHandler "+err );
      return err ;
  }); 
  
  return response ;

};