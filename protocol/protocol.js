/*
    CEC protocol and getter functions
*/

// Load the protocol files
var ceccodes = require('./ceccodes.json');
var msgstructs = require('./msgstruct.json');


function decodemessage(data) {
    /*
        Decode a CEC message.
        data is bytes returned from the CEC bus
        returns a message object

        examples:
        TRAFFIC: [             159]	<< 1f:84:10:00:01  // Report (broadcast) Physical address
        TRAFFIC: [          318004]	<< 1f:00:85:01  // Feature abort for request: Request active source, reason: Not in correct mode to respond
        TRAFFIC: [          318004]	<< 1f:85        // Request active source
        TRAFFIC: [             126]	<< e0
        DEBUG:   [             146]	Recorder 1 (1): physical address changed from ffff to 1000
        NOTICE:  [             152]	CEC client registered: libCEC version = 2.1.4, client version = 2.1.4, firmware version = 1
    */

    // default message info
    var message = {
        // Object to hold components of the message
        'id' : null,            // Message id
        'direction' : null,
        'origin' : null,        // first 4 bits (nibble of the first byte is the origin/source device logical address
        'destination' : null,   // second 4 bits (nibble of the first byte is the destination/target device logical address
        'opcode' : null,        // second byte is the opcode
        'data' : null,          // subsequent bytes are data or status values
        'type' : null,           // type of message: traffics, poll, notice
        'error' : []
    }

    var regex = /^TRAFFIC:\s*\[\s*(\d+)\]\s*([<>]{2})\s*([0-9a-fA-F]{2}):*([0-9a-fA-F]{0,2}):*([:0-9a-fA-F]*)/
    /*
        ^          Start of string
        TRAFFIC    The word TRAFFIC
        \s*        Zero or more white space characters
        \[         Open square bracket
        \s*        Zero or more white space characters
        (\d+)      One or more digits (captured as a group). This is the message id. E.g. 12345
        \]         Close square bracket
        \s*        Zero or more white space characters
        ([<>]{2})  2 < or > characters (captured as a group). This is the message direction (request or response). E.g. << or >>
        \s*        Zero or more white space characters
        ([0-8a-fA-F]{2})  2 hexadecimal characters (captured as a group). These are two bytes representing the origin and destination devices for the

message. E.g. 1f ( 1 is the origin device – Recorder 1, f is Broadcast to all devices)
        :          A colon
        ([0-8a-fA-F]{2})  2 hexadecimal characters (captured as a group). This is the opcode (message type)
        :          A colon
        ([:0-8a-fA-F]*)   Zero or more hexadecimal characters or a colon. The length is dependent on the message type. Can range from nothing (no

parameters or data) to 4E:45:4f:54:67:73:74:65:72 which represents a device OSD name.

        tested using: http://www.myregextester.com/index.php
    */
    var result = data.match(regex);
    if (result) {
        // Valid match so extract all the items

        // All valid matched messages will contain id, direction, origin/destination
        message.id = result[1];
        message.direction = result[2];
        message.origin = result[3].slice(0,1);        // the first byte of the OD string is the origin device (hex)
        message.destination = result[3].slice(1,2);   // the second byte of the OD string is the destination device (hex)


        if (result[4] === '') {
            /* Poll message (no opcode)
               Message contains: id, direction, origin/destination
                    e.g. 'TRAFFIC: [             159]	<< 1f' (Recorder 1 polling to all devices(
                    result = (
                    [0] => TRAFFIC: [             159] << 1f
                        [1] => 159
                        [2] => <<
                        [3] => 1f
                    )
            */
            message.type = 'poll';
            message.name = 'Poll';
            message.opcode = null;
        } else {
            /*
                Message contains an opcode (may also have additional data/parameters)
                Message containsat least : id, direction, origin/destination, opcode
                    e.g. TRAFFIC: [             159]	<< 1f:84  (Request blah)
                    result = (
                        [0] => TRAFFIC: [             159] << 1f:84
                        [1] => 159
                        [2] => <<
                        [3] => 1f
                        [4] => 84
                    )

            */
            message.type = 'traffic';
            message.opcode = "0x" + result[4];                   // The message opcode (hex)
        }

        if (message.opcode !== null && result.length > 5) {
            /*
                Message also contains data/parameters
                Message has 5 components (id, direction, origin/destination, opcode, and some data)
                    e.g. TRAFFIC: [             159]	<< 1f:84:19
                    (
                        [0] => TRAFFIC: [             159] << 1f:84:19
                        [1] => 159
                        [2] => <<
                        [3] => 1f
                        [4] => 84
                        [5] => 19
                    )
                    e.g. TRAFFIC: [             159]	<< 1f:84:19:00
                    (
                        [0] => TRAFFIC: [             159] << 1f:84:19:00
                        [1] => 159
                        [2] => <<
                        [3] => 1f
                        [4] => 84
                        [5] => 19:00
                    )
                    e.g. TRAFFIC: [             159]	<< 1f:84:19:00:3B:7a:F9
                    (
                        [0] => TRAFFIC: [             159] << 1f:84:19:00:3B:7a:F9
                        [1] => 159
                        [2] => <<
                        [3] => 1f
                        [4] => 84
                        [5] => 19:00:3B:7a:F9
                    )
                'data' could be a single item (such as a status parameter) or multiple (such as an OSD string: 45:4f:54:67:73:74:65:72
            */
            //message.data = result[5].split(':');    // returns a list e.g. “4E:45:4f:54” ---> ["4E', "45", "4f", "54"]
            message.data = result[5];
        }
    } else {
        message.error.push('**** Some unknown traffic data: ' + data + ' ****');
    }

    // Decode the data payload
    if (message.data !== null) {
        message.data = decodedatapayload(message);       // Now an object
    }

    // Look up info in the CEC protocol
    if (message.opcode !== null) {
        message.name = getmsgstruct(message.opcode, 'name');
    }
    message.origindevice = getcodedesc('logicaladdressorigin', message.origin);
    message.destinationdevice = getcodedesc('logicaladdressdestination', message.destination);

    message.text = prettyprint(message);
    //console.log(message.text);

    return message;
}

function decodedatapayload(message) {
    /*
        decodes the payload (data, parameters etc) from the CEC message
        'message' is a decoded message (but the data payload has not been decoded)
        Decodes the data in the message
        Returns the decoded payload (as an object)

        "opcode" : {
            "0x00" : {
                "name" : "FEATURE_ABORT",
                "alias" : "Feature Abort",
                "description" : "Used to determine the current power status of a target device",
                "messagetype" : "direct|broadcast",
                "_comment"    : "2 data items, each is one byte long. First item is hexadecimal (0-9,a-f), second item is a decimal number",
            "datastructure" : {
                "regex"             : "/^([0-9a-FA-F]{2}):(\d{2})$/",
                "lookups"           : ["opcode", "featureabortreason"],
                "parameternames"    : ["requestopcode", "featureabortreason"]
            }
        }
    */

    var regex, parameters;

    // Store orinal message data as an object
    var payload = {
        "rawdata" : message.data     //rawdata is a list
    };

    // Look up the message structure and find the number of data items
    var datastruct = getmsgstruct(message.opcode, "datastructure");
    if (datastruct) {
        // Data structure found for this opcode
        if (datastruct.regex === null || datastruct === '') {
            // no regex, so return the raw data payload
            return payload;
        } else {
            // extract the data structure details
            regex = new RegExp(datastruct.regex);           // Regexp to extract the data items from the raw data string
            parameters = datastruct.parameters;             // Details on the expected paramters for this message type/opcode
        }
    } else {
        // Data structure not found in the protocol
        // just return the raw data payload
        return payload;
    }

    // Extract the data payload using the regular expression, apply any data conversions and code lookups
    var match = message.data.match(regex);
    if (match) {
        // Valid regex match so extract the data items, convert, lookup codes, and save to the parameters as define in the data structure
        for (var i=0;i<parameters.length; i++) {
            var param = parameters[i];
            if (i < match.length) {
                // Have not hit the end of the regex match groups so we have data items available
                var dataitem = match[i+1];    // Note that the first item is the original string and the first group starts at index 1
                payload[param.name] = dataitem;

                if (param.converter) {
                    // Data conversion required
                    if (param.converter == 'hex') {
                        dataitem = byte2hex(dataitem);
                    } else if (param.converter == 'hex2dec') {
                        dataitem = hex2dec(dataitem);
                    } else if (param.converter == 'hex2char' || param.converter == 'hex2chars') {
                        dataitem = hex2char(dataitem);
                    } else if (param.converter == 'physicaladdress') {
                        dataitem = decodephysicaladdress(dataitem);
                    } else if (param.converter !== null) {
                        console.log('Unknown data payload converter: ' + param.converter);
                    }
                    payload[param.name] = dataitem;     // Overwrite data item with the coverted dataitem
                }

                if (param.lookup) {
                    // Code lookup required
                    var lk;
                    if (param.lookup === 'opcode') {
                        lk = getmsgstruct(dataitem, 'name');
                    } else {
                        lk = getcodedesc(param.lookup, dataitem);
                    }
                    if (lk) {
                        payload[param.name] = lk;       // Overwite data with the lookup value
                    } else {
                        // Failed to find code in the protocol
                        console.log('Failed to find protocol code ' + dataitem + ' for lookup ' + param.lookup);
                    }
                }
            } else {
                // Hit the end of the regex groups
                // So no data for this parameter
                if (param.optional) {
                    // no data for an optional parameter so set the parameter to null
                    payload[param.name] = null;
                } else {
                    // Parameter is mandatory but no data retrieved
                    message.error.push('Mandatory data missing for parameter: ' + param.name + ' in message: ' + message.string);
                }
            }
        }
    } else {
        // No regex match
        message.error.push('Error extracting message payload (no regex match) for: ' + message.string);
    }

    // return the extracted data/parameters
    return payload;
}

function encodephysicaladdress(addr) {
    /*
        Encode a physical address so libcec can understand it
        Input address looks like 1.0.0.0
        Returns 10:00
    */
    if (typeof addr === 'undefined') {
        return null;
    }

    var result = "";
    // Loop through the characters of the string
    for (var i=0; i<addr.length; i++ ) {
        if (addr.charAt(i) !== '.') {
            result += addr.charAt(i);
            if (i < 2) {
                // Add a colon after 2 chars
                result += ":";
            }
        }
    }
    return result;
}

function decodephysicaladdress(addr) {
    /*
        Decode a physical address from libcec
        Input address looks like 10:00
        Returns 1.0.0.0
    */
    if (typeof addr === 'undefined') {
        return null;
    }

    var result = "";
    // Loop through the characters of the string
    for (var i=0; i<addr.length; i++ ) {
        if (addr.charAt(i) !== ':') {
            result += addr.charAt(i);
            if (i < addr.length - 1) {
                // Add a dot unless we are at then end of the string
                result += ".";
            }
        }
    }
    return result;
}

function hex2char(hexbytes) {
    /*
        Converts a hex bytes to ASCII charaters
        Ignores the colon between bytes
        example:
            hexchars = "65:6e:67"
            asciichars = "eng"
    */
    if (typeof hexbytes === 'undefined') {
        return null;
    }

    var asciichars = "";
    for (var j=0; j<hexbytes.length; j=j+3) {
        // convert the entire byte to an ASCII char
        // first convert it to decimail using parseInwith with base 16
        // Then find the ascii character useing the decimal code
        asciichars += String.fromCharCode(parseInt(hexbytes.substr(j,2),16));
    }
    return asciichars;
}

function hex2dec(hexbytes) {
    /*
        Converts a hex bytes to decimal
        Ignores the colon between bytes
        example:
            hexbytes = "1b"
            decimal = "27"
    */
    if (typeof hexbytes === 'undefined') {
        return null;
    }

    var asciistr = "";
    for (var j=0; j<hexbytes.length; j=j+3) {
        // convert the entire byte to an number
        // first convert it to decimail using parseInwith with base 16
        // Then find the ascii character useing the decimal code
        asciistr += parseInt(hexbytes.substr(j,2),16).toString();
    }
    return parseInt(asciistr, 10);
}

function byte2hex (input) {
    /*
        convert bytes to hex
        Removes colons between the bytes
        Preprends 0x to denote heaxadecimal
    */
    if (typeof input === 'undefined') {
        return null;
    }
    var output = input.replace(':', '');
    output = '0x'+ output;
    return output;
}

function getcodedesc(param, itemcode) {
    // Looks up the selected itemcode for the nominated parameter and returns its description
    // If no item code returns all items for that nominated parameter (object)

    if (param in ceccodes) {
        // The parameter exists in the protocol file
        var codes = ceccodes[param];
        if (itemcode) {
            // itemcode is provided so retrieve the description
            if (itemcode in codes) {
                // the property exists for that item
                return codes[itemcode];
            } else {
                // The itemcode does not exist
                console.log('Unknown item code requested: ' + itemcode + 'for parameter: ' + param);
                return null;
            }
        } else {
            // Item not requested so return all codes for the nominated parameter
            return codes;
        }
    } else {
        // Item not found in the protocol
        console.log("Parameter not found in protocol : " + param);
        return null;
    }
}

function getmsgstruct(opcode, prop) {
    // Extracts the requested property (prop) from the message structure for the nominated message type (opcode)
    // If not property requested then returns the entire message structure object

    // Use the opcode to look up the message details
    if (opcode in msgstructs.opcodes) {
        // The opcode exists in the protocol file so extract the message structure for that opcode
        var struct = msgstructs.opcodes[opcode];
        if (typeof struct != 'object' || struct === null) {
            // missing message strcuture
            console.log('Missing message structure for opcode: ' + opcode);
            return null;
        }
        if (prop) {
            // prop is provided so retrieve the requested message object property
            if (prop in struct) {
                // the property exists
                return struct[prop];
            } else {
                // The property does not exist
                console.log('Property: ' + prop + ' not found in message structure protocol.: ' + JSON.stringify(struct, null, 4));
                return null;
            }
        } else {
            // property not requested so return the message strcuture
            return struct;
        }
    } else {
        // Opcode not found in the protocol
        console.log("Unknown opcode in protocol message structure lookup: " + opcode);
        return null;
    }
}

function prettyprint(message) {
    var text = "From " + message.origindevice + " to " + message.destinationdevice + ". " + message.name + ": " + JSON.stringify(message.data, null, 4);

    return text;
}


// Expose key functions
module.exports.decodemessage = decodemessage;
module.exports.getitemdesc = getcodedesc;
module.exports.getmsgstruct = getmsgstruct;

/*
    Unit Tests
*/
if (require.main === module) {
    // Run some unit tests
    // Run this module directly (not as a 'required' module) to run these tests
    console.log('\n\n', decodemessage('TRAFFIC: [          427329] >> 10:47:4B:69:64:73:20:50:53:33'));
    console.log('\n\n', decodemessage('TRAFFIC: [          427329] >> 1b:9e:04'));

    // Get the description for an item in a nominated parameter
    console.log(getcodedesc("vendorid", "0x000678"));           // -> Marantz
    // Get all the item descriptions for a nominated parameter  // -> Object showing all vendors
    console.dir(getcodedesc("vendorid"));

    // Get a message structure propperty
    console.log(getmsgstruct("0x32", "name"));      //-> <Set Menu Language>
    // Get the entire message structure for a message
    console.log(getmsgstruct("0x32"));      //-> Object showing structure for the Set Menu Language Message

    console.log('\n\n', decodemessage('TRAFFIC: [             159] << 1f:84:10:00:01'));
    console.log('\n\n', decodemessage('TRAFFIC: [          318004] << 1f:00:85:01'));
}
